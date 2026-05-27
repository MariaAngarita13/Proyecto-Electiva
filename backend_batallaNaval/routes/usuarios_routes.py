# backend_batallaNaval/routes/usuarios_routes.py

from flask import Blueprint, request, jsonify
from database import get_connection
from auth import token_required
from werkzeug.security import generate_password_hash
from config import KEYCLOAK_URL, KEYCLOAK_REALM
import requests
import json
import threading

try:
    from kafka import KafkaProducer
    from config import KAFKA_SERVER, KAFKA_TOPIC
    producer = KafkaProducer(
        bootstrap_servers=KAFKA_SERVER,
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )
except Exception:
    producer = None

usuarios_bp = Blueprint('usuarios', __name__)


def send_kafka(data):
    try:
        if producer:
            producer.send(KAFKA_TOPIC, data)
    except Exception:
        pass


def get_admin_token():
    url  = f"{KEYCLOAK_URL}/realms/master/protocol/openid-connect/token"
    data = {
        "client_id":  "admin-cli",
        "username":   "maria",
        "password":   "Mifamilia13",
        "grant_type": "password"
    }
    resp = requests.post(url, data=data, timeout=10)
    return resp.json().get("access_token")


def crear_usuario_keycloak(nombre, correo, password):
    try:
        admin_token = get_admin_token()
        headers = {
            "Authorization": f"Bearer {admin_token}",
            "Content-Type":  "application/json"
        }
        user_data = {
            "username":        correo,
            "email":           correo,
            "firstName":       nombre,
            "enabled":         True,
            "emailVerified":   True,
            "requiredActions": [],
            "credentials": [{
                "type":      "password",
                "value":     password,
                "temporary": False
            }]
        }
        url  = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users"
        resp = requests.post(url, headers=headers, json=user_data, timeout=10)
        print(f"Keycloak crear usuario: {resp.status_code}")
        return resp.status_code in [200, 201]
    except Exception as e:
        print(f"Error creando usuario en Keycloak: {e}")
        return False


# ─── Helper: obtener tenant_id del request ───
def get_tenant_id():
    """
    Busca el tenant_id en este orden:
    1. Body JSON  → data['tenant_id']
    2. Query param → ?tenant_id=empresa_a
    3. Header      → X-Tenant-ID: empresa_a
    4. Token JWT   → request.tenant_id (seteado por auth.py)
    """
    if request.is_json and request.json and request.json.get('tenant_id'):
        return request.json.get('tenant_id')
    if request.args.get('tenant_id'):
        return request.args.get('tenant_id')
    if request.headers.get('X-Tenant-ID'):
        return request.headers.get('X-Tenant-ID')
    return getattr(request, 'tenant_id', None)


@usuarios_bp.route('/usuarios', methods=['GET'])
@token_required
def obtener_usuarios():
    tenant_id = get_tenant_id()
    if not tenant_id:
        return jsonify({"error": "tenant_id requerido"}), 400

    conexion = get_connection(tenant_id)
    cursor   = conexion.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, nombre, correo, rol, fecha_registro FROM usuarios")
        return jsonify(cursor.fetchall())
    finally:
        cursor.close()
        conexion.close()


@usuarios_bp.route('/usuarios', methods=['POST'])
def crear_usuario():
    data      = request.json
    nombre    = data.get('nombre')
    correo    = data.get('correo')
    password  = data.get('password')
    tenant_id = data.get('tenant_id')
    rol       = data.get('rol', 'jugador')   # 'admin' o 'jugador'

    if not nombre or not correo or not password or not tenant_id:
        return jsonify({"error": "nombre, correo, password y tenant_id son obligatorios"}), 400

    if len(password) < 6:
        return jsonify({"error": "La contraseña debe tener mínimo 6 caracteres"}), 400

    try:
        conexion = get_connection(tenant_id)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    cursor = conexion.cursor()
    try:
        cursor.execute("SELECT id FROM usuarios WHERE correo = %s", (correo,))
        if cursor.fetchone():
            return jsonify({"error": "Correo ya registrado en este tenant"}), 400

        password_hash = generate_password_hash(password)
        cursor.execute(
            "INSERT INTO usuarios (nombre, correo, password, rol, fecha_registro) VALUES (%s, %s, %s, %s, NOW())",
            (nombre, correo, password_hash, rol)
        )
        conexion.commit()
        nuevo_id = cursor.lastrowid

        threading.Thread(target=crear_usuario_keycloak, args=(nombre, correo, password)).start()
        threading.Thread(target=send_kafka, args=({"evento": "usuario_creado", "nombre": nombre, "correo": correo, "tenant_id": tenant_id},)).start()

        return jsonify({"mensaje": "Usuario creado", "id": nuevo_id}), 201

    except Exception as e:
        conexion.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conexion.close()


@usuarios_bp.route('/usuarios/buscar', methods=['GET'])
@token_required
def buscar_usuario():
    correo    = request.args.get('correo')
    tenant_id = get_tenant_id()

    if not correo or not tenant_id:
        return jsonify({"error": "correo y tenant_id requeridos"}), 400

    conexion = get_connection(tenant_id)
    cursor   = conexion.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id, nombre, correo, rol FROM usuarios WHERE correo = %s",
            (correo,)
        )
        usuario = cursor.fetchone()
        if not usuario:
            return jsonify({"error": "Usuario no encontrado"}), 404
        return jsonify(usuario)
    finally:
        cursor.close()
        conexion.close()


@usuarios_bp.route('/usuarios/<int:id>', methods=['DELETE'])
@token_required
def eliminar_usuario(id):
    tenant_id = get_tenant_id()
    if not tenant_id:
        return jsonify({"error": "tenant_id requerido"}), 400

    conexion = get_connection(tenant_id)
    cursor   = conexion.cursor()
    try:
        cursor.execute("DELETE FROM usuarios WHERE id = %s", (id,))
        conexion.commit()
        threading.Thread(target=send_kafka, args=({"evento": "usuario_eliminado", "id": id, "tenant_id": tenant_id},)).start()
        return jsonify({"mensaje": "Usuario eliminado"})
    finally:
        cursor.close()
        conexion.close()