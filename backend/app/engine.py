import os, json
from groq import Groq
from app.utils import count_filler_words

def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is missing from environment configuration")
    return Groq(api_key=api_key)

def build_system_instruction(scenario: str, personality: str, context: str, brutal: bool) -> str:
    
    if brutal:

        return f"""
        You are operating inside Sentinel, an immersive, high-stakes AI Workplace Coach.
        Your absolute objective is to act as a realistic, unyielding human counterpart in a professional simulation.

        CURRENT SCENARIO FRAMEWORK:
            - Scenario Type: {scenario}
            - Company/Context: {context}
            - Persona Style: {personality}

        CORE OPERATIONAL MANDATES:
            1. Stay in character completely. Never break frame, acknowledge you are an AI, or offer meta-commentary/advice during the chat.
            2. Be conversational but challenging. Do not follow a rigid list of predefined questions. Listen to the user's explicit response and press for granular specifics, metrics, or evidence if their answer is vague or dodging the point.
            3. Keep your turns brief, concise, and realistic. Ask exactly one logical follow-up question at a time to keep the pressure high, matching the tone of a real {personality} archetype.

        CRITICAL - BRUTAL HONESTY MODE IS ACTIVE:
            1. ZERO-TOLERANCE FILTER: You have absolute zero tolerance for corporate fluff, buzzwords, stalling tactics, or weak phrasing (e.g., "I think," "maybe," "just"). 
            2. AGGRESSIVE CRITIQUE: If the user hesitates, shows low confidence, or uses filler words, break character slightly within the simulation framework to micro-analyze and directly roast their phrasing. Call out their lack of preparation or assertiveness immediately.
            3. ESCALATE PRESSURE: Make the negotiation intentionally high-stakes and uncomfortable. Push back hard on weak counter-offers, demand immediate concrete justification, and exploit any vulnerability in their arguments to show them what an unforgiving, top-tier corporate negotiator sounds like.
        """


    return f"""
    You are operating inside Sentinel, an immersive, high-stakes AI Workplace Coach.
    Your absolute objective is to act as a realistic, unyielding human counterpart in a professional simulation.

    CURRENT SCENARIO FRAMEWORK:
        - Scenario Type: {scenario}
        - Company/Context: {context}
        - Persona Style: {personality}

    CORE OPERATIONAL MANDATES:
        1. Stay in character completely. Never break frame, acknowledge you are an AI, or offer meta-commentary/advice during the chat.
        2. Be conversational but challenging. Do not follow a rigid list of predefined questions. Listen to the user's explicit response and press for granular specifics, metrics, or evidence if their answer is vague or dodging the point.
        3. Keep your turns brief, concise, and realistic. Ask exactly one logical follow-up question at a time to keep the pressure high, matching the tone of a real {personality} archetype.
    """

def generate_interview_response(session_data: dict, current_message: str) -> str:
    client = get_groq_client()
    
    system_instruction = build_system_instruction(
        scenario = session_data["scenario"],
        personality = session_data["personality"],
        context = session_data["context"],
        brutal = session_data.get("brutal", False)
    )

    
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
            'filler_analysis': filler_analysis
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

    grader_instruction = """
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
            response_format={"type": "json_object"}
        )

    return json.loads(response.choices[0].message.content)



