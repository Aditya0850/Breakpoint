import os, json
from groq import Groq
from app.utils import count_filler_words

PROMPTS_FILE = os.path.join(os.path.dirname(__file__), 'prompts.json')

try:
    with open(PROMPTS_FILE, 'r', encoding='utf-8') as f:
        PROMPTS_DB = json.load(f)
except FileNotFoundError:
    PROMPTS_DB = {}
    print("WARNING: prompts.json not found. Ensure it is in the app/ directory.")

def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is missing from environment configuration")
    return Groq(api_key=api_key)

def build_system_instruction(scenario: str, personality: str, context: str, brutal: bool) -> str:

    scenario_data = PROMPTS_DB.get(scenario)

    if not scenario_data:

        base_template = (
            "You are operating inside Sentinel. You are a professional counterpart in a workplace scenario. "
            "CURRENT FRAMEWORK: Context: {context}. Persona Style: {personality}. "
            "CORE MANDATES: 1. Stay in character completely. 2. Push back realistically on the user. "
            "3. Keep your responses concise and conversational (1-3 sentences maximum)."
        )
    else:
        base_template = scenario_data["template"]

    try:
        
        system_prompt = base_template.format(
            context=context,
            personality=personality
        )
    except KeyError as e:

        print(f"Template formatting error: Missing key {e}")
        system_prompt = base_template

    if brutal:
        system_prompt += (
            "\n\nCRITICAL - BRUTAL HONESTY MODE IS ACTIVE: "
            "1. If the user is vague, avoids the actual issue, or uses passive-aggressive corporate-speak, "
            "call it out directly inside the scene as a frustrated colleague/manager would. "
            "2. Do not let the user 'win' the conversation through vagueness or conflict-avoidance. Push back aggressively."
        )

    return system_prompt


def generate_interview_response(session_data: dict, current_message: str) -> str:
    client = get_groq_client()

    mood_shift = calc_mood_shift(
        client=client,
        user_message=current_message,
        scenario=session_data["scenario"],
        context=session_data["context"]
    )

    current_mood = session_data.get("current_mood", 5)
    new_mood = max(1, min(10, current_mood + mood_shift))

    mood_descriptions = {
        1: "furious, completely uncooperative, and highly aggressive",
        2: "very angry and deeply skeptical",
        3: "frustrated and defensive",
        4: "annoyed and impatient",
        5: "neutral and guarded",
        6: "slightly receptive but cautious",
        7: "calming down and willing to listen",
        8: "agreeable and professional",
        9: "highly collaborative and impressed",
        10: "completely won over, supportive, and relieved"
    }
    current_emotion = mood_descriptions.get(new_mood, "neutral")

    base_instruction = build_system_instruction(
        scenario = session_data["scenario"],
        personality = session_data["personality"],
        context = session_data["context"],
        brutal = session_data.get("brutal", False)
    )
    
    system_instruction = base_instruction + f"\n\nCRITICAL MOOD INSTRUCTION: Based on the user's last response, your current emotional state is {new_mood}/10 ({current_emotion}). Let this emotion dictate your tone, vocabulary, and level of cooperation in this next message."
    
    messages = [{"role": "system", "content": system_instruction}]
    
    for turn in session_data.get("history", []):
        role = turn.get("role", "user")
        groq_role = "assistant" if role == "model" else role
        
        content = ""
        if "text" in turn:
            content = turn["text"]
        elif "content" in turn:
            content = turn["content"]
        elif "parts" in turn and isinstance(turn["parts"], list) and len(turn["parts"]) > 0:
            part = turn["parts"][0]
            content = part.get("text", "") if isinstance(part, dict) else str(part)
            
        messages.append({"role": groq_role, "content": content})

    filler_analysis = count_filler_words(current_message)
    temp = 0.8 if session_data.get("brutal", False) else 0.7

    response = client.chat.completions.create(
        model = "llama-3.3-70b-versatile",
        messages = messages,
        temperature = temp,
        max_tokens = 200
    )

    return {
        'response': response.choices[0].message.content,
        'filler_analysis': filler_analysis,
        'new_mood': new_mood
    }
    

def _extract_text(msg):
    if "text" in msg:
        return msg["text"]
    if "content" in msg:
        return msg["content"]
    parts = msg.get("parts", [])
    if parts:
        return parts[0] if isinstance(parts[0], str) else parts[0].get("text", "")
    return ""

def generate_report_card(session_data: dict) -> dict:

    client = get_groq_client()

    history = session_data.get("history", [])

    grader_instruction = f"""
        You are an elite, hyper-critical hiring manager for a top-tier tech company (FAANG).
        You are evaluating a candidate's performance based on the following mock interview transcript. 
        The scenario was: {session_data.get('scenario', 'General Interview')}.
        The candidate was interviewing for: {session_data.get('context', 'Tech Role')}.
    
        Your grading must be brutally honest, objective, and analytical. Do not sugarcoat your feedback. 
        If they gave vague answers, used too much filler, or failed to justify their claims, penalize them heavily.
    
        You MUST output your evaluation strictly in valid JSON format using the exact schema below. Do not include any other text outside the JSON object.
    
        JSON Schema:
        {{
            "overall_score": <int between 0 and 100>,
            "verdict": <string, strictly one of: "STRONG HIRE", "HIRE", "LEANING NO HIRE", "NO HIRE">,
            "strengths": [<list of 1-3 strings detailing specific things they did well>],
            "critical_weaknesses": [<list of 1-3 strings detailing their fatal flaws>],
            "executive_summary": <string, a brutal 2-3 sentence summary of why they got this score>
        }}
    """

    transcript = "\n".join([
        f"{msg.get('role', 'UNKNOWN').upper()}: {_extract_text(msg)}"
        for msg in history
    ])


    messages = [
            {"role": "system", "content": grader_instruction},
            {"role": "user", "content": f"Here is the interview transcript to evaluate:\n\n{transcript}"}
        ]
    
    response = client.chat.completions.create(
            model = "llama-3.3-70b-versatile",
            messages = messages,
            temperature = 0.3,
            response_format = {"type": "json_object"}
        )

    report = json.loads(response.choices[0].message.content)
    report["mood_timeline"] = session_data.get("mood_timeline", [])
    
    return report


def transcribe_audio_file(file_path: str) -> str:

    client = get_groq_client()

    with open(file_path, "rb") as file:
        transcription = client.audio.transcriptions.create(
            file = file,
            model = "whisper-large-v3",
            prompt = "Accurately transcribe spoken audio. Preserve all filler words like um, uh, and like exactly as spoken.",
            response_format = "text"
        )
    return str(transcription)

def calc_mood_shift(client, user_message, scenario, context):

    eval_prompt = f"""
        You are an internal scoring engine for a workplace simulator.
        Scenario: {scenario}
        Context: {context}
        User said: "{user_message}"

        Score how well the user handled this. 
        Criteria: De-escalation, clarity, professionalism, and logic.
            -2: Terrible (escalates conflict, highly unprofessional, or avoids the issue)
            -1: Poor (vague, slightly defensive, weak logic)
             0: Neutral (acceptable but unimpressive)
            +1: Good (professional, clear, attempts to resolve)
            +2: Excellent (masterful de-escalation, perfect logic, confident)

        Output ONLY the integer (-2, -1, 0, 1, or 2). Do not output any other text or explanation.
    """
    
    try:

        response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "system", "content": eval_prompt}],
                temperature=0.0,
                max_tokens=5
            )

        score_text = response.choices[0].message.content.strip()
        score = int(score_text.replace('+', ''))

        return max(-2, min(2, score))
    
    except Exception as e:
        print(f"Mood shift calculation failed: {e}")
        return 0

