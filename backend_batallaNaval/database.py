# backend_batallaNaval/database.py

import mysql.connector
from config import TENANTS

def get_connection(tenant_id):

    config = TENANTS.get(tenant_id)
    if not config:
        raise Exception(f"Tenant '{tenant_id}' no existe o no está registrado")
    return mysql.connector.connect(**config)