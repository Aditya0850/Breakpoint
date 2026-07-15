# 🚀 Sentinel Backend Progress Tracker

This document tracks the implementation status of the **Sentinel AI Backend API**.

> **Frontend Team:** Use this document to determine which endpoints, request/response payloads, and backend features are stable and ready for integration.

---

# 🏗️ Phase 1 — Core Architecture & Setup

- [x] Initialize Flask application structure (`app/`)
- [x] Configure dependency management using `uv` and `pyproject.toml`
- [x] Integrate Groq API client (`llama-3.3-70b-versatile`)
- [x] Replace legacy in-memory session storage with Supabase PostgreSQL
- [x] Integrate the `supabase` Python SDK
- [x] Configure environment variables for:
  - `GROQ_API_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_KEY`

---

# 🧠 Phase 2 — AI Engine & Analytics

- [x] Dynamic prompt injection using:
  - Scenario
  - Context
  - Personality
- [x] Brutal Mode toggle for aggressive interviewer behavior
- [x] spaCy (`en_core_web_sm`) integration for NLP analysis
- [x] Hybrid filler-word detection
  - Pure fillers (`um`, `uh`, etc.)
  - Context-sensitive fillers (`like`, `so`, etc.)
  - Reduced false positives
- [ ] Refine evaluation prompt so grading focuses strictly on the **user's communication and de-escalation skills**, rather than the AI interviewer's behavior

---

# 🔌 Phase 3 — API Endpoints

## ✅ POST `/api/start`

Creates a brand-new interview session.

- [x] Generates a UUID session ID
- [x] Stores initial configuration in Supabase
- [x] Returns session metadata

---

## ✅ POST `/api/chat`

Handles the live conversation.

- [x] Accepts user message
- [x] Retrieves session state from Supabase
- [x] Updates conversation history (JSONB)
- [x] Runs filler-word analysis
- [x] Generates AI response
- [x] Saves updated state back to Supabase

---

## ✅ POST `/api/evaluate`

Performs final interview evaluation.

- [x] Retrieves full conversation history
- [x] Sends complete transcript to LLM
- [x] Returns structured evaluation report
- [x] Automatically persists report to the `evaluation_report` column in Supabase

---

# 🎙️ Phase 4 — Frontend Integration & Audio

- [ ] Implement Web Speech API recording flow (Frontend)
- [ ] *(Optional)* Backend Whisper transcription endpoint
- [ ] End-to-end latency testing
- [ ] Render analytics using the `mood_timeline` array

---

# 🚀 Phase 5 — Deployment

- [ ] Configure production startup (`gunicorn`) via `start.sh` or `Procfile`
- [ ] Deploy to Render or Railway
- [ ] Verify production environment variables:
  - `GROQ_API_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_KEY`
- [ ] Re-enable Supabase Row Level Security (RLS) after user authentication is implemented

---

# 📚 API Reference

---

# POST `/api/start`

Initializes a new interview simulation.

## Request

```json
{
  "scenario": "Salary Negotiation",
  "personality": "Strict FAANG interviewer",
  "context": "Senior Developer at Google",
  "brutal": true
}
```

## Response (201)

```json
{
  "status": "Success",
  "session_id": "uuid-string",
  "message": "Simulation initialized. Ready for first prompt."
}
```

---

# POST `/api/chat`

Processes one conversational turn.

## Request

```json
{
  "session_id": "uuid-string",
  "message": "User response text"
}
```

## Response (200)

```json
{
  "response": "The AI's text response...",
  "current_turn_fillers": {
    "um": 1,
    "like": 1
  },
  "total_new_fillers": 2
}
```

### Notes

- `current_turn_fillers` contains filler counts detected only in the current user message.
- `total_new_fillers` is the total number of fillers detected during the current turn.

> **⚠️ Frontend Note:** Confirm the response key is `total_new_fillers`. Earlier backend iterations used inconsistent naming (`total_new_filers`).

---

# POST `/api/evaluate`

Generates the final interview evaluation.

## Request

```json
{
  "session_id": "uuid-string"
}
```

## Response (200)

```json
{
  "overall_score": 87,
  "verdict": "HIRE",
  "strengths": [
    "Clear communication",
    "Good conflict resolution"
  ],
  "critical_weaknesses": [
    "Could provide more concise answers"
  ],
  "executive_summary": "The candidate demonstrated strong communication skills and handled challenging scenarios effectively."
}
```

---

# Evaluation Notes

- The backend automatically stores the generated evaluation report in the Supabase `evaluation_report` column.
- `verdict` is always one of:
  - `"STRONG HIRE"`
  - `"HIRE"`
  - `"LEANING NO HIRE"`
  - `"NO HIRE"`
- `strengths` and `critical_weaknesses` may be empty arrays. The frontend should handle empty lists gracefully.

---

# 🗄️ Backend Architecture Summary

```
Client
   │
   ▼
POST /api/start
   │
   ▼
Supabase (Create Session)
   │
   ▼
POST /api/chat
   │
   ├── Retrieve session
   ├── Generate AI response
   ├── Detect filler words
   ├── Update conversation history
   └── Persist session state
   │
   ▼
POST /api/evaluate
   │
   ├── Retrieve transcript
   ├── Generate evaluation
   ├── Save evaluation_report
   └── Return report to frontend
```

---

# 📝 Current Status

| Component | Status |
|-----------|--------|
| Flask Backend | ✅ Complete |
| Groq Integration | ✅ Complete |
| Supabase Persistence | ✅ Complete |
| Session Management | ✅ Complete |
| NLP Filler Detection | ✅ Complete |
| Interview Evaluation | ✅ Complete |
| Evaluation Persistence | ✅ Complete |
| Frontend Integration | 🟡 In Progress |
| Audio Support | ⏳ Pending |
| Production Deployment | ⏳ Pending |

---

_Last Updated: July 2026_
