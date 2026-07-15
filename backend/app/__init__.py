from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

def create_app():

    load_dotenv()
    
    app = Flask(__name__)


    CORS(app)

    from app.routes import api

    app.register_blueprint(api, url_prefix = "/api")

    return app
