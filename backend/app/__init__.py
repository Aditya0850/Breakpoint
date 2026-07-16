from re import template

from flask import Flask
from flask_cors import CORS
from flasgger import Swagger
from dotenv import load_dotenv

def create_app():

    load_dotenv()
    
    app = Flask(__name__)

    CORS(app)

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

    app.register_blueprint(api, url_prefix = "/api")

    return app
