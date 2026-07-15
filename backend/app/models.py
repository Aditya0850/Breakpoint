import time, threading

class SessionManager:

    def __init__(self):

        self._sessions = {}
        self._lock = threading.Lock()

    def create_session(self, session_id: str, scenario: str, personality: str, context: str, brutal: bool):

        with self._lock:

            self._sessions[session_id] = {
                    "scenario": scenario,
                    "personality": personality,
                    "context": context,
                    "created_at": time.time(),
                    "history": [],
                    "brutal": brutal
                    }

            return self._sessions[session_id]

    def get_session(self, session_id: str):
        
        with self._lock:
            return self._sessions.get(session_id)

    def append_message(self, session_id: str, role: str, text: str):

        with self._lock:
            
            if session_id in self._sessions:
                self._sessions[session_id]["history"].append({
                    "role": role,
                    "parts": [text]
                    })

state_db = SessionManager()
