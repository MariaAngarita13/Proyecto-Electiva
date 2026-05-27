# backend_batallaNaval/auth.py

from functools import wraps
from flask import request, jsonify
import jwt
from config import KEYCLOAK_URL, KEYCLOAK_REALM

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")

        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Token no proporcionado"}), 401

        token = auth_header.split(" ")[1]

        try:
            jwks_uri = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/certs"
            jwks_client = jwt.PyJWKClient(jwks_uri)
            signing_key = jwks_client.get_signing_key_from_jwt(token)

            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                options={"verify_aud": False}
            )
            request.user = payload

            # ─── Extraer tenant_id del token de Keycloak ───
            # Keycloak incluye los grupos/atributos en el payload.
            # Guardamos el tenant_id para que las rutas lo usen.
            request.tenant_id = payload.get("tenant_id") or \
                                 payload.get("tenant") or \
                                 None

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expirado"}), 401
        except Exception as e:
            return jsonify({"error": f"Token inválido: {str(e)}"}), 401

        return f(*args, **kwargs)
    return decorated