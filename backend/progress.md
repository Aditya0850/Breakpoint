# 🚀 Sentinel Backend Progress Tracker

This document tracks the implementation status of the Sentinel AI backend API. 
Frontend team: Use this to check which endpoints and JSON payloads are currently stable and ready for wiring.

## 🏗️ Phase 1: Core Architecture & Setup
- [x] Initialize Flask application structure (`app/`).
- [x] Set up dependency management (`uv`, `pyproject.toml`).
- [x] Configure Groq API client integration (`llama-3.3-70b-versatile`).
- [x] Build in-memory Session Manager (`models.py`) to track conversation history.

## 🧠 Phase 2: AI Engine & Analytics
- [x] **Dynamic Prompt Injection:** Engine accepts `scenario`, `context`, and `personality` to build custom interview parameters.
- [x] **Brutal Mode:** Implemented boolean toggle to activate aggressive, zero-tolerance AI persona.
- [x] **NLP Filler Word Detection:** Integrated `spaCy` (`en_core_web_sm`) in `utils.py`.
- [x] **Hybrid Filler Logic:** accurately tracks pure fillers ("um", "uh") and context-dependent tricky fillers ("like", "so") without false positives.

## 🔌 Phase 3: API Endpoints (Routing)
- [x] `POST /api/start` - Initializes session, sets parameters, returns `session_id`.
- [x] `POST /api/chat` - Accepts user message, updates history, runs NLP metrics, and returns AI response + current turn analytics.
- [ ] `GET /api/evaluate` - (PENDING) Analyzes the entire session history and returns a final structured report card / score.

## 🎙️ Phase 4: Frontend Handoff & Audio
- [ ] Implement Web Speech API / Audio recording flow (Frontend).
- [ ] (Optional) Backend Whisper transcription endpoint if we handle audio parsing server-side.
- [ ] Final end-to-end latency testing.

## 🚀 Phase 5: Deployment
- [ ] Write `start.sh` or `Procfile` configured for `gunicorn -w 1` (Critical: Must run on a single worker to preserve in-memory dictionary state).
- [ ] Push to Render/Railway and verify environment variables (`GROQ_API_KEY`).

---
**Note to Frontend:** The `/api/chat` endpoint currently returns this data structure. You can map these to the UI components immediately:
```json
{
  "response": "The AI's text response...",
  "current_turn_fillers": {
    "um": 1,
    "like": 1
  },
  "total_new_fillers": 2
}
