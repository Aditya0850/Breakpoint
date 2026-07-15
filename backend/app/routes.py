from flask import Blueprint, request, jsonify
import uuid
from app.models import state_db
from app.engine import generate_interview_response, transcribe_audio_file
from app.utils import count_filler_words
import os


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
            "total_new_fillers": ai_response["filler_analysis"]["total_increment"]
            }), 200

    except Exception as e:

        return jsonify({"error": f"AI Engine Failure: {str(e)}"}), 500


@api.route('/evaluate', methods = ["POST"])
def eval_chat():

    data = request.get_json()

    if not data or "session_id" not in data:

        return jsonify({"error": "Missing required field: session_id"}), 400

    session_details = state_db.get_session(session_id= data["session_id"])

    if not session_details:
        return jsonify({"error": "Session not found or expired"}), 404

    try:

        from app.engine import generate_report_card

        evaluation_report = generate_report_card(session_details)

        return jsonify(evaluation_report), 200

    except Exception as e:
        return jsonify({"error": f"Evaluation Engine Failure: {str(e)}"}), 500



@api.route('/chat/audio', methods = ['POST'])
def chat_audio_turn():

    if 'audio' not in request.files or 'session_id' not in request.form:

        return jsonify({"error": "Missing 'audio' file or 'session_id' form field"}), 400

    audio_file = request.files['audio']
    session_id = request.form['session_id']

    session_details = state_db.get_session(session_id = session_id)
    if not session_details:
        return jsonify({"error": "Session not found or expired"}), 404

    temp_path = f"temp_{session_id}.webm"
    audio_file.save(temp_path)

    try:

        user_msg = transcribe_audio_file(temp_path)

        if not user_msg.strip():
            return jsonify({"error": "Whisper could not detect any speech in the audio clip."}), 400

        filler_metrics = count_filler_words(user_msg)

        state_db.append_message(session_id=session_id, role="user", text=user_msg)

        ai_response = generate_interview_response(session_details, user_msg)
        state_db.append_message(session_id=session_id, role="model", text=ai_response["response"])

        return jsonify({
            "user_transcript": user_msg,
            "response": ai_response["response"],
            "current_turn_fillers": filler_metrics["details"],
            "total_new_fillers": filler_metrics["total_increment"]
        }), 200

    except Exception as e:
        return jsonify({"error": f"Audio Engine Failure: {str(e)}"}), 500

    finally:

        if os.path.exists(temp_path):
            os.remove(temp_path)

