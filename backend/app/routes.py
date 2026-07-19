from flask import Blueprint, render_template_string, send_file, request, jsonify, Response, stream_with_context, g
import uuid
from app.models import state_db
from app.engine import generate_interview_response, transcribe_audio_file
from app.utils import count_filler_words, requires_auth
import os, joblib, json, io
from weasyprint import HTML

try:
    from app.engine import PROMPTS_DB
except ImportError:
    PROMPTS_DB = {"Hostile Termination": True}

api = Blueprint('api', __name__)

@api.route('/start', methods = ['POST'])
@requires_auth
def start_session():

    """
    Initialize a new Sentinel training session.
    ---
    tags:
      - Simulation
    parameters:
      - in: header
        name: Authorization
        type: string
        required: true
        description: "Bearer <JWT_TOKEN>"
      - in: body
        name: body
        schema:
          type: object
          required:
            - scenario
            - personality
            - context
          properties:
            scenario: {type: string, example: "Hostile Termination"}
            personality: {type: string, example: "Defensive senior engineer"}
            context: {type: string, example: "Caught violating data policies."}
            brutal: {type: boolean, example: true}
    responses:
      201:
        description: Session initialized successfully
    """


    data = request.get_json()

    if data and all(k in data for k in ("role", "interview_type", "style_archetype", "difficulty")):

        scenario = data["interview_type"]
        personality = data["style_archetype"]
        context = f"{data['role']} — {data['difficulty']} level"
        brutal = data["difficulty"].lower() == "senior"

    elif data and all(k in data for k in ("scenario", "personality", "context")):

        scenario = data["scenario"]
        personality = data["personality"]
        context = data["context"]
        brutal = data.get("brutal", False)

    else:
        return jsonify({"error": "Missing required setup fields"}), 400

    

    session_id = str(uuid.uuid4())

    state_db.create_session(
            session_id = session_id,
            user_id = g.user_id,
            scenario = scenario,
            personality = personality,
            context = context,
            brutal = brutal,
            current_mood = 5,
            mood_timeline = [5]
            )

    return jsonify({
        "status" : "Success",
        "session_id" : session_id,
        "message" : "Simulation initialized. Ready for first prompt"
        }), 201

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, '..', 'toxicity_model.pkl')

try:
    toxicity_model = joblib.load(MODEL_PATH)
    print("✅ ML Toxicity Model loaded into memory successfully!")
except Exception as e:
    print(f"⚠️ Warning: Could not load ML model. Ensure toxicity_model.pkl is in the root directory. Error: {e}")
    toxicity_model = None

def process_chat(usr_msg: str) -> tuple[bool, int]:

    if toxicity_model:

        probabilities = toxicity_model.predict_proba([usr_msg])[0]
        toxicity_score = round(probabilities[1] * 100, 2)
        is_toxic = bool(toxicity_score > 50.0)

        return is_toxic, toxicity_score

    return False, 0.0


@api.route('/chat', methods = ["POST"])
@requires_auth
def chat_turn():

    data = request.get_json()

    if not data or not all(k in data for k in ("session_id", "message")):

        return jsonify({"error": "Missing required setup fields (session_id, message)"}), 400

    user_msg = data.get("message", "")

    if len(user_msg) > 1000:
        return jsonify({"error": "Message too long. Please keep it under 1000 characters."}), 400

    is_toxic, toxicity_score = process_chat(usr_msg = user_msg)
    
    print(f"🧠 ML Classifier -> Toxic: {is_toxic} ({toxicity_score}%) | Msg: '{user_msg}'")

    session_details = state_db.get_session(session_id = data["session_id"])

    if not session_details:
        return jsonify({"error": "Session not found or expired"}),404

    if session_details.get("user_id") != g.user_id:
        return jsonify({"error": "Session not found or expired"}), 404

    try:

        raw_history = session_details.get("history", [])
        if isinstance(raw_history, str):
            history = json.loads(raw_history)
        else:
            history = raw_history

        history.append({"role": "user", "text": user_msg})

        if len(history) > 10:
            history = history[-10:]

        session_details["history"] = history

        state_db.append_message(session_id=data["session_id"], role="user", text=user_msg)

        def generate():

            print("🚀 [DEBUG] Stream started!")
            ping = json.dumps({"type": "chunk", "text": "*(Thinking...)* "})
            yield f"data: {ping}\n\n"

            for sse_string in generate_interview_response(session_details, user_msg):
                yield sse_string

                if '"type": "metadata"' in sse_string:
                    json_str = sse_string.replace("data: ", "").strip()
                    metadata = json.loads(json_str)

                    state_db.append_message(
                        session_id=data["session_id"], 
                        role="model", 
                        text=metadata["full_text"]
                    )
                    state_db.update_mood(data['session_id'], metadata["new_mood"])

        return Response(stream_with_context(generate()), mimetype='text/event-stream')


    except Exception as e:
        return jsonify({"error": f"AI Engine Failure: {str(e)}"}), 500



@api.route('/evaluate', methods = ["POST"])
@requires_auth
def eval_chat():

    data = request.get_json()

    if not data or "session_id" not in data:

        return jsonify({"error": "Missing required field: session_id"}), 400

    session_details = state_db.get_session(session_id= data["session_id"])

    if not session_details:
        return jsonify({"error": "Session not found or expired"}), 404

    if session_details.get("user_id") != g.user_id:
        return jsonify({"error": "Session not found or expired"}), 404

    try:

        from app.engine import generate_report_card

        evaluation_report = generate_report_card(session_details)
        state_db.save_evaluation(data["session_id"], evaluation_report)

        return jsonify(evaluation_report), 200

    except Exception as e:
        return jsonify({"error": f"Evaluation Engine Failure: {str(e)}"}), 500



@api.route('/chat/audio', methods = ['POST'])
@requires_auth
def chat_audio_turn():

    if 'audio' not in request.files or 'session_id' not in request.form:

        return jsonify({"error": "Missing 'audio' file or 'session_id' form field"}), 400

    audio_file = request.files['audio']
    session_id = request.form['session_id']

    session_details = state_db.get_session(session_id = session_id)
    if not session_details:
        return jsonify({"error": "Session not found or expired"}), 404

    if session_details.get("user_id") != g.user_id:
        return jsonify({"error": "Session not found or expired"}), 404


    temp_path = f"temp_{session_id}.webm"
    audio_file.save(temp_path)

    try:

        user_msg = transcribe_audio_file(temp_path)
        if not user_msg.strip():
            return jsonify({"error": "Whisper could not detect any speech in the audio clip."}), 400

        is_toxic, toxicity_score = process_chat(usr_msg = user_msg)


        filler_metrics = count_filler_words(user_msg)

        state_db.append_message(session_id=session_id, role="user", text=user_msg)
        
        session_details = state_db.get_session(session_id=session_id)

        raw_history = session_details.get("history", [])
        if isinstance(raw_history, str):
            history = json.loads(raw_history)
        else:
            history = raw_history

        if len(history) > 10:
            history = history[-10:]

        session_details["history"] = history

        full_text = ""
        new_mood = 5

        for chunk in generate_interview_response(session_details, user_msg):
            payload = json.loads(chunk.replace("data: ", "").strip())

            if payload["type"] == "chunk":
                full_text += payload["text"]

            elif payload["type"] == "metadata":
                new_mood = payload["new_mood"]

        state_db.append_message(session_id=session_id, role="model", text=full_text)
        state_db.update_mood(session_id, new_mood) 
        
        return jsonify({
            "user_transcript": user_msg,
            "response": full_text,
            "current_turn_fillers": filler_metrics["details"],
            "total_new_fillers": filler_metrics["total_increment"],
            "current_mood": new_mood, 
            "toxicity_score": toxicity_score, 
            "is_toxic": is_toxic 
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Audio Engine Failure: {str(e)}"}), 500

    finally:

        if os.path.exists(temp_path):
            os.remove(temp_path)


@api.route('/export/<session_id>', methods = ['GET'])
@requires_auth
def export(session_id):

    session_details = state_db.get_session(session_id=session_id)
    if not session_details:
        return jsonify({"error": "Session not found or expired"}), 404

    if session_details.get("user_id") != g.user_id:
        return jsonify({"error": "Session not found or expired"}), 404

    report_data = session_details.get("evaluation_report")
    if not report_data:
        return jsonify({"error": "No evaluation data found. Run /api/evaluate first."}), 400

    if isinstance(report_data, str):
        try:
            report_data = json.loads(report_data)
        except Exception:
            return jsonify({"error": "Malformed evaluation report data"}), 400

    html_template = """
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Sentinel Simulation Report</title>
      <style>
        @page {
          size: A4;
          margin: 20mm;
          @bottom-right {
            content: "Page " counter(page) " of " counter(pages);
            font-size: 9pt;
            color: #6b7280;
          }
        }
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #1f2937;
          line-height: 1.5;
          margin: 0;
        }
        .header {
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .title {
          font-size: 24pt;
          font-weight: bold;
          color: #111827;
          margin: 0;
        }
        .subtitle {
          font-size: 12pt;
          color: #4b5563;
          margin-top: 5px;
        }
        .meta-grid {
          border: 1px solid #e5e7eb;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 30px;
          background-color: #f9fafb;
        }
        .section-title {
          font-size: 14pt;
          font-weight: bold;
          color: #1f2937;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 5px;
          margin-top: 25px;
          margin-bottom: 15px;
        }
        .metric-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 15px;
        }
        .score-badge {
          color: #3b82f6;
          font-weight: bold;
          float: right;
          font-size: 16pt;
        }
        .verdict-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-weight: bold;
          background-color: #fee2e2;
          color: #991b1b;
        }
        .summary-card {
          background-color: #eff6ff;
          border: 1px solid #bfdbfe;
          padding: 15px;
          border-radius: 6px;
          color: #1e3a8a;
        }
        ul {
          margin: 0;
          padding-left: 20px;
        }
        li {
          margin-bottom: 6px;
        }
        .empty-note {
          color: #9ca3af;
          font-style: italic;
        }
        .mood-track {
          font-family: monospace;
          font-size: 12pt;
          color: #1f2937;
        }
      </style>
    </head>
    <body>

      <div class="header">
        <h1 class="title">Sentinel Performance Evaluation</h1>
        <div class="subtitle">Workplace Simulation Behavioral Analytics Report</div>
      </div>

      <div class="meta-grid">
        <strong>Session ID:</strong> <span>{{ session_id }}</span><br>
        <strong>Scenario:</strong> <span>{{ session.scenario }}</span>
      </div>

      <div class="section-title">Overall Result</div>
      <div class="metric-card">
        <span class="score-badge">{{ report_data.overall_score }} / 100</span>
        <div class="verdict-badge">{{ report_data.verdict }}</div>
      </div>

      <div class="section-title">Strengths</div>
      <div class="metric-card">
        {% if report_data.strengths and report_data.strengths|length > 0 %}
        <ul>
          {% for item in report_data.strengths %}
          <li>{{ item }}</li>
          {% endfor %}
        </ul>
        {% else %}
        <p class="empty-note">No standout strengths identified in this session.</p>
        {% endif %}
      </div>

      <div class="section-title">Critical Weaknesses</div>
      <div class="metric-card">
        {% if report_data.critical_weaknesses and report_data.critical_weaknesses|length > 0 %}
        <ul>
          {% for item in report_data.critical_weaknesses %}
          <li>{{ item }}</li>
          {% endfor %}
        </ul>
        {% else %}
        <p class="empty-note">No critical weaknesses identified.</p>
        {% endif %}
      </div>

      <div class="section-title">Mood Timeline</div>
      <div class="metric-card">
        <div class="mood-track">{{ report_data.mood_timeline | join('  →  ') }}</div>
        <p style="color: #6b7280; font-size: 9pt; margin-top: 8px; margin-bottom: 0;">
          Scale: 1 (hostile) — 10 (fully won over). Tracks the AI counterpart's mood across the conversation.
        </p>
      </div>

      <div class="section-title">Executive Summary</div>
      <div class="summary-card">
        {{ report_data.executive_summary }}
      </div>

    </body>
    </html>
    """

    rendered_html = render_template_string(
        html_template, 
        session_id=session_id, 
        session=session_details, 
        report_data=report_data
    )

    pdf_buffer = io.BytesIO()
    HTML(string=rendered_html).write_pdf(target=pdf_buffer)
    pdf_buffer.seek(0)

    return send_file(
        pdf_buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"Sentinel_Report_{session_id[:8]}.pdf"
    )

@api.route('/auth/signup', methods = ['POST'])
def signup():

    data = request.get_json()

    if not data or not all(k in data for k in ("email", "password")):
        return jsonify({"error": "Missing email or password"}), 400

    try:

        auth_response = state_db.signup_user(data["email"], data["password"])

        return jsonify({
            "message": "User registered successfully",
            "user_id": auth_response.user.id
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 400

@api.route('/auth/login', methods = ['POST'])
def login():
    
    data = request.get_json()

    if not data or not all(k in data for k in ("email", "password")):
        return jsonify({"error": "Missing email or password"}), 400

    try:

        auth_response = state_db.login_user(data["email"], data["password"])

        return jsonify({
            "message": "Login successful",
            "access_token": auth_response.session.access_token,
            "user_id": auth_response.user.id
        }), 200
    except Exception as e:
        return jsonify({"error": "Invalid email or password"}), 401

@api.route('/health', methods=['GET'])
def health_check():
    """Verify backend and dependency connectivity."""
    status = {
        "status": "online",
        "services": {
            "database": False,
            "groq_api": False
        }
    }

    try:
        state_db.db.table("sessions").select("id", count="exact", head=True).execute()
        status["services"]["database"] = True
    except Exception as e:
        print(f"Health Check: Database unreachable: {e}")

    try:
        from app.engine import get_groq_client
        client = get_groq_client()
        client.models.list()
        status["services"]["groq_api"] = True
    except Exception as e:
        print(f"Health Check: Groq API unreachable: {e}")

    code = 200 if all(status["services"].values()) else 503
    return jsonify(status), code
