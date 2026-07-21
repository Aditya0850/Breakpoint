from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flasgger import Swagger
from dotenv import load_dotenv
import os

def create_app():

    load_dotenv()
    
    app = Flask(__name__)

    app.config['DEBUG'] = os.getenv('FLASK_DEBUG', 'False') == 'True'

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    swagger_template = {
      "swagger": "2.0",
      "info": {
        "title": "Sentinel Backend API",
        "description": "Enterprise AI HR Simulation Engine",
        "version": "1.0.0"
      }
    }

    swagger_config = {
        "headers": [],
        "specs": [
            {
                "endpoint": 'apispec_1',
                "route": '/apispec_1.json',
                "rule_filter": lambda rule: True,
                "model_filter": lambda tag: True,
            }
        ],
        "static_url_path": "/flasgger_static",
        "swagger_ui": True,
        "specs_route": "/apidocs/"
    }

    Swagger(app, config = swagger_config, template = swagger_template)

    from app.routes import api

    app.register_blueprint(api, url_prefix = "/api/v1")

    FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static')

    @app.route('/')
    @app.route('/<path:path>')
    def serve_frontend(path='index.html'):
        file = os.path.join(FRONTEND_DIST, path)
        if os.path.isfile(file):
            return send_from_directory(FRONTEND_DIST, path)
        return send_from_directory(FRONTEND_DIST, 'index.html')

    @app.errorhandler(Exception)
    def handle_exception(e):

        print(f"🚨 Unhandled Exception: {str(e)}")

        status_code = 500
        if hasattr(e, 'code'):
            status_code = e.code
            
        return jsonify({
            "status": "error",
            "message": str(e),
            "type": e.__class__.__name__
        }), status_code

    return app
