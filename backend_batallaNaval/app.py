# backend_batallaNaval/app.py
from flask import Flask
from flask_cors import CORS
from extensions import cache
from routes.usuarios_routes import usuarios_bp
from routes.partidas import partidas_bp
from routes.login_routes import login_bp
import os

app = Flask(__name__)

# ─── CORS ───
CORS(app, resources={r"/*": {"origins": [
    "http://localhost:4200",
    "http://localhost:4201",
    "https://proyecto-electiva-2.onrender.com",
]}})

app.config["CACHE_TYPE"]            = "SimpleCache"
app.config["CACHE_DEFAULT_TIMEOUT"] = 60
cache.init_app(app)

app.register_blueprint(usuarios_bp)
app.register_blueprint(partidas_bp)
app.register_blueprint(login_bp)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
