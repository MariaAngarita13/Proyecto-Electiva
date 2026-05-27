# backend_batallaNaval/routes/partidas.py

from flask import Blueprint, request, jsonify
from database import get_connection
from auth import token_required
from extensions import cache
from config import KAFKA_SERVER, KAFKA_TOPIC
import json
import threading

try:
    from kafka import KafkaProducer
    producer = KafkaProducer(
        bootstrap_servers=KAFKA_SERVER,
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )
except Exception:
    producer = None

partidas_bp = Blueprint('partidas', __name__)


def send_kafka(data):
    try:
        if producer:
            producer.send(KAFKA_TOPIC, data)
    except Exception:
        pass


def get_tenant_id():
    if request.is_json and request.json and request.json.get('tenant_id'):
        return request.json.get('tenant_id')
    if request.args.get('tenant_id'):
        return request.args.get('tenant_id')
    if request.headers.get('X-Tenant-ID'):
        return request.headers.get('X-Tenant-ID')
    return getattr(request, 'tenant_id', None)


@partidas_bp.route('/partidas', methods=['POST'])
@token_required
def crear_partida():
    data       = request.json
    tenant_id  = data.get('tenant_id')
    usuario_id = data.get('usuario_id')
    resultado  = data.get('resultado')

    if not tenant_id or not usuario_id or not resultado:
        return jsonify({"error": "tenant_id, usuario_id y resultado son obligatorios"}), 400

    try:
        conexion = get_connection(tenant_id)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    cursor = conexion.cursor()
    try:
        cursor.execute(
            "INSERT INTO partidas (usuario_id, resultado) VALUES (%s, %s)",
            (usuario_id, resultado)
        )
        conexion.commit()

        threading.Thread(target=send_kafka, args=({"usuario_id": usuario_id, "resultado": resultado, "tenant_id": tenant_id},)).start()

        return jsonify({"mensaje": "Partida guardada"}), 201

    except Exception as e:
        conexion.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conexion.close()


@partidas_bp.route('/partidas', methods=['GET'])
@token_required
def obtener_partidas():
    tenant_id = get_tenant_id()
    if not tenant_id:
        return jsonify({"error": "tenant_id requerido"}), 400

    conexion = get_connection(tenant_id)
    cursor   = conexion.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM partidas")
        return jsonify(cursor.fetchall())
    finally:
        cursor.close()
        conexion.close()


@partidas_bp.route('/partidas/<int:id>', methods=['GET'])
@token_required
def obtener_partida(id):
    tenant_id = get_tenant_id()
    if not tenant_id:
        return jsonify({"error": "tenant_id requerido"}), 400

    conexion = get_connection(tenant_id)
    cursor   = conexion.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM partidas WHERE id = %s", (id,))
        partida = cursor.fetchone()
        if not partida:
            return jsonify({"error": "Partida no encontrada"}), 404
        return jsonify(partida)
    finally:
        cursor.close()
        conexion.close()


@partidas_bp.route('/usuarios/<int:usuario_id>/partidas', methods=['GET'])
@token_required
def partidas_por_usuario(usuario_id):
    tenant_id = get_tenant_id()
    if not tenant_id:
        return jsonify({"error": "tenant_id requerido"}), 400

    conexion = get_connection(tenant_id)
    cursor   = conexion.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM partidas WHERE usuario_id = %s", (usuario_id,))
        return jsonify(cursor.fetchall())
    finally:
        cursor.close()
        conexion.close()


@partidas_bp.route('/partidas/<int:id>', methods=['DELETE'])
@token_required
def eliminar_partida(id):
    tenant_id = get_tenant_id()
    if not tenant_id:
        return jsonify({"error": "tenant_id requerido"}), 400

    conexion = get_connection(tenant_id)
    cursor   = conexion.cursor()
    try:
        cursor.execute("DELETE FROM partidas WHERE id = %s", (id,))
        conexion.commit()
        return jsonify({"mensaje": "Partida eliminada"})
    finally:
        cursor.close()
        conexion.close()


@partidas_bp.route('/estadisticas/<int:usuario_id>', methods=['GET'])
@token_required
def estadisticas(usuario_id):
    tenant_id = get_tenant_id()
    if not tenant_id:
        return jsonify({"error": "tenant_id requerido"}), 400

    conexion = get_connection(tenant_id)
    cursor   = conexion.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN resultado = 'ganada' THEN 1 ELSE 0 END) as ganadas,
                SUM(CASE WHEN resultado = 'perdida' THEN 1 ELSE 0 END) as perdidas
            FROM partidas
            WHERE usuario_id = %s
        """, (usuario_id,))
        return jsonify(cursor.fetchone())
    finally:
        cursor.close()
        conexion.close()


@partidas_bp.route('/ranking', methods=['GET'])
@token_required
def ranking():
    tenant_id = get_tenant_id()
    if not tenant_id:
        return jsonify({"error": "tenant_id requerido"}), 400

    # Cache por tenant para que los rankings no se mezclen
    cache_key = f'ranking_{tenant_id}'

    @cache.cached(timeout=60, key_prefix=cache_key)
    def _ranking():
        conexion = get_connection(tenant_id)
        cursor   = conexion.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT u.nombre, COUNT(*) as victorias
                FROM partidas p
                JOIN usuarios u ON p.usuario_id = u.id
                WHERE p.resultado = 'ganada'
                GROUP BY u.id
                ORDER BY victorias DESC
            """)
            return jsonify(cursor.fetchall())
        finally:
            cursor.close()
            conexion.close()

    return _ranking()