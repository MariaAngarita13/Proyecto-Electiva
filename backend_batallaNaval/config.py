# backend_batallaNaval/config.py

# ─── TENANTS: cada empresa tiene su propia base de datos ───
TENANTS = {
    "empresa_a": {
        "host":     "127.0.0.1",
        "user":     "batalla_user",
        "password": "1234",
        "database": "batalla_empresa_a"
    },
    "empresa_b": {
        "host":     "127.0.0.1",
        "user":     "batalla_user",
        "password": "1234",
        "database": "batalla_empresa_b"
    },
    
}

KAFKA_SERVER = "172.20.10.2"
KAFKA_TOPIC  = "partidas"

KEYCLOAK_URL           = "http://localhost:8082"
KEYCLOAK_REALM         = "Arquitectura"
KEYCLOAK_CLIENT_ID     = "batalla-admin"
KEYCLOAK_CLIENT_SECRET = "ZH8GEaBXXNFClGOPZzitCpsg0usCicmS"

SECRET_KEY = "clave_secreta_batalla_naval"