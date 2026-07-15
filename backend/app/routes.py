from flask import Blueprint, request, jsonify, session
import uuid
from app.models import state_db
from app.engine import generate_interview_response


api = Blueprint('api', __name__)

@api.route('/start', methods = ['POST'])
def start_session():

    data = request.get_json()

    if not data or not all(k in data for k in ("scenario", "personality", "context")):

        return jsonify({"error": "Missing required setup fields (scenario, personality, context)"}), 400
    

    session_id = str(uuid.uuid4())

    state_db.create_session(
            session_id = session_id,
            scenario = data["scenario"],
            personality = data["personality"],
            context = data["context"],
            brutal = data.get("brutal", False)
            )
    return jsonify({
        "status" : "Success",
        "session_id" : session_id,
        "message" : "Simulation initialized. Ready for first prompt"
        }), 201


@api.route('/chat', methods = ["POST"])
def chat_turn():

    data = request.get_json()

    if not data or not all(k in data for k in ("session_id", "message")):

        return jsonify({"error": "Missing required setup fields (session_id, message)"}), 400

    user_msg = data.get("message", "")

    session_details = state_db.get_session(session_id = data["session_id"])

    if not session_details:
        return jsonify({"error": "Session not found or expired"}),404

    try:

        state_db.append_message(session_id = data.get("session_id"), role = "user", text = data.get("message"))

        ai_response = generate_interview_response(session_details, user_msg)

        state_db.append_message(session_id = data.get("session_id"), role = "model", text = ai_response["response"])

        return jsonify({
            "response" : ai_response["response"],
            "current_turn_fillers": ai_response["filler_analysis"]["details"],
            "total_new_filers": ai_response["filler_analysis"]["total_increment"]
            }), 200

    except Exception as e:

        return jsonify({"error": f"AI Engine Failure: {str(e)}"}), 500
