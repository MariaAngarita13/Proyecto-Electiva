# backend_batallaNaval/routes/login_routes.py

from flask import Blueprint, request, jsonify
import requests
from database import get_connection
from config import KEYCLOAK_URL, KEYCLOAK_REALM, KEYCLOAK_CLIENT_ID, KEYCLOAK_CLIENT_SECRET

login_bp = Blueprint('login', __name__)


@login_bp.route('/login', methods=['POST'])
def login():
    data      = request.json
    correo    = data.get('correo')
    password  = data.get('password')
    tenant_id = data.get('tenant_id')   # ← "empresa_a" o "empresa_b"

    if not correo or not password:
        return jsonify({"error": "Correo y contraseña requeridos"}), 400

    if not tenant_id:
        return jsonify({"error": "tenant_id requerido (empresa_a, empresa_b, ...)"}), 400

    # 1. Autenticar con Keycloak
    token_url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"
    payload = {
        "client_id":     KEYCLOAK_CLIENT_ID,
        "client_secret": KEYCLOAK_CLIENT_SECRET,
        "username":      correo,
        "password":      password,
        "grant_type":    "password"
    }

    try:
        kc_response = requests.post(token_url, data=payload, timeout=10)
        print(f"Keycloak status: {kc_response.status_code}")
    except Exception as e:
        return jsonify({"error": f"No se pudo conectar a Keycloak: {str(e)}"}), 503

    if kc_response.status_code != 200:
        kc_error = kc_response.json()
        return jsonify({
            "error":                "Credenciales incorrectas",
            "keycloak_error":       kc_error.get("error"),
            "keycloak_description": kc_error.get("error_description")
        }), 401

    access_token = kc_response.json().get("access_token")

    # 2. Buscar usuario en la BD del tenant específico
    try:
        conexion = get_connection(tenant_id)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    cursor = conexion.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id, nombre, correo, rol FROM usuarios WHERE correo = %s",
            (correo,)
        )
        usuario = cursor.fetchone()
    finally:
        cursor.close()
        conexion.close()

    if not usuario:
        return jsonify({"error": "Usuario no registrado en este tenant"}), 404

    print(f"ROL DEL USUARIO: {usuario.get('rol')}")
    return jsonify({
        "token":      access_token,
        "usuario_id": usuario["id"],
        "nombre":     usuario["nombre"],
        "correo":     usuario["correo"],
        "rol":        usuario.get("rol", "jugador"),
        "tenant_id":  tenant_id          # ← el frontend lo guarda y lo envía en cada request
    }), 200


@login_bp.route('/usuarios/buscar', methods=['GET'])
def buscar_usuario():
    correo    = request.args.get('correo')
    tenant_id = request.args.get('tenant_id')

    if not correo or not tenant_id:
        return jsonify({"error": "correo y tenant_id requeridos"}), 400

    try:
        conexion = get_connection(tenant_id)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    cursor = conexion.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id, nombre, correo FROM usuarios WHERE correo = %s",
            (correo,)
        )
        usuario = cursor.fetchone()
        if not usuario:
            return jsonify({"error": "Usuario no encontrado"}), 404
        return jsonify(usuario)
    finally:
        cursor.close()
        conexion.close()