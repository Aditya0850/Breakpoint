import spacy
from app.models import supabase
from flask import request, jsonify, g
import functools

nlp = spacy.load('en_core_web_sm')

def count_filler_words(text: str) -> dict:

    pure_fillers = {"um", "uh", "hmm"}
    tricky_fillers = {"like", "so", "basically", "literally"}

    found = {}
    total = 0

    doc = nlp(text.lower())

    for token in doc:

        word = token.text

        if word in pure_fillers:
            found[word] = found.get(word, 0) + 1
            total += 1

        elif word in tricky_fillers:

            if token.pos_ not in ["VERB", "NOUN", "PROPN"]:
                found[word] = found.get(word, 0) + 1
                total += 1

    return {"details": found, "total_increment": total}

def verify_supabase_jwt(token: str):

    try:
        user_response = supabase.auth.get_user(token)
        if user_response and user_response.user:
            return {
                "id": user_response.user.id,
                "email": user_response.user.email
            }
    except Exception as e:
        print(f"🔒 Auth Token Validation Failed: {e}")
    return None

def requires_auth(f):

    @functools.wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", None)
        
        if not auth_header:
            return jsonify({"error": "Authorization header missing"}), 401
        
        try:
            token_type, token = auth_header.split(" ")
            if token_type.lower() != "bearer":
                return jsonify({"error": "Authorization header must start with Bearer"}), 401
        except ValueError:
            return jsonify({"error": "Malformed Authorization header format"}), 401
            
        user_context = verify_supabase_jwt(token)
        if not user_context:
            return jsonify({"error": "Invalid or expired security token"}), 401

        g.user_id = user_context["id"]
        g.user_email = user_context["email"]
        
        return f(*args, **kwargs)
    return decorated
