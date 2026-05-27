# backend_batallaNaval/app.py

from flask import Flask
from flask_cors import CORS

from extensions import cache
from routes.usuarios_routes import usuarios_bp
from routes.partidas import partidas_bp
from routes.login_routes import login_bp

app = Flask(__name__)

# ─── CORS ───
CORS(app, resources={r"/*": {"origins": [
    "http://localhost:4200",
    "http://localhost:4201",
]}})

app.config["CACHE_TYPE"]            = "SimpleCache"
app.config["CACHE_DEFAULT_TIMEOUT"] = 60

cache.init_app(app)

app.register_blueprint(usuarios_bp)
app.register_blueprint(partidas_bp)
app.register_blueprint(login_bp)

if __name__ == '__main__':
    app.run(debug=True, port=5000)