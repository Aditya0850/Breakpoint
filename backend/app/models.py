import os
from supabase import create_client, Client

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

class SessionManager:

    def __init__(self):

        self.db = supabase

    def create_session(self, session_id: str, scenario: str, personality: str, context: str, brutal: bool, current_mood: int, mood_timeline: list[int]):

        data = {
            "id": session_id,
            "scenario": scenario,
            "context": context,
            "personality": personality,
            "brutal_mode": brutal,
            "current_mood": current_mood,
            "mood_timeline": mood_timeline,
            "history": []
        }

        response = self.db.table("sessions").insert(data).execute()
        return response.data[0] if response.data else None

    def get_session(self, session_id: str):
        
        response = self.db.table("sessions").select("*").eq("id", session_id).execute()
        return response.data[0] if response.data else None

    def append_message(self, session_id: str, role: str, text: str):

        session = self.get_session(session_id)
        if session:
            history = session.get("history", [])
            history.append({
                "role": role,
                "parts": [text] 
            })
            self.db.table("sessions").update({"history": history}).eq("id", session_id).execute()
       
    def update_mood(self, session_id: str, new_mood: int):

        session = self.get_session(session_id)
        if session:
            timeline = session.get("mood_timeline", [])
            timeline.append(new_mood)
            self.db.table("sessions").update({
                "current_mood": new_mood,
                "mood_timeline": timeline
            }).eq("id", session_id).execute()

    def save_evaluation(self, session_id: str, report: dict):
        self.db.table("sessions").update({
            "evaluation_report": report
        }).eq("id", session_id).execute()


state_db = SessionManager()
