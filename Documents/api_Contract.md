# API Contract

Base URL: `/api/v1`

All protected routes require `Authorization: Bearer <JWT>` header.

Interactive Swagger docs: `GET /apidocs/` (served by Flask).

---

## Authentication

### POST /auth/signup
Register a new user. Optionally seeds the `profiles` row with the display name and role.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "your-password",
  "first_name": "Ada",
  "last_name": "Lovelace",
  "role": "student"
}
```
`first_name`, `last_name`, `role` are optional (`role` defaults to `student`).

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user_id": "uuid"
}
```

### POST /auth/login
Authenticate an existing user. The frontend uses Supabase's `signInWithPassword` directly; this endpoint exists as an API-level convenience.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "access_token": "jwt-token",
  "user_id": "uuid"
}
```

### POST /auth/oauth/profile
Backfill a `profiles` row for a user who signed up via OAuth (idempotent — creates or updates).

**Request:**
```json
{
  "first_name": "Ada",
  "last_name": "Lovelace",
  "role": "student"
}
```

**Response (200):**
```json
{
  "message": "Profile ready",
  "profile": { "id": "uuid", "first_name": "Ada", "last_name": "Lovelace", "role": "student" }
}
```

---

## Scenario Library

### GET /scenarios
Return the full scenario library (source of truth: `backend/app/prompts.json`).

**Response (200):**
```json
{
  "scenarios": [
    { "key": "Firing an Employee", "label": "Firing an Employee", "category": "HR_and_Interviews" }
  ]
}
```

---

## Sessions

### POST /start
Initialize a new simulation session.

Two request shapes are accepted:

**Current (frontend):**
```json
{
  "scenario": "Firing an Employee",
  "personality": "Underperforming employee",
  "context": "You are the manager delivering the termination.",
  "brutal": false
}
```

**Legacy (backward compatible):**
```json
{
  "role": "Senior Software Engineer",
  "interview_type": "Behavioral",
  "style_archetype": "corporate",
  "difficulty": "Senior"
}
```

**Response (201):**
```json
{
  "status": "Success",
  "session_id": "uuid",
  "message": "Simulation initialized. Ready for first prompt"
}
```

### POST /chat
Send a message in an active session. Returns Server-Sent Events (SSE).

**Request:**
```json
{
  "session_id": "uuid",
  "message": "Your response here"
}
```

**SSE Event Stream:**
```
data: {"type":"chunk","text":"*(Thinking...)*"}

data: {"type":"chunk","text":"I understand your position,"}

data: {"type":"metadata","full_text":"I understand your position, but...","filler_analysis":{"details":{"like":1},"total_increment":1},"new_mood":4}
```

The `metadata` event is final and contains the complete response text, filler word analysis, and updated mood score.

### POST /chat/audio
Send an audio message in an active session (transcribed with Whisper).

**Form data:**
| Field | Type | Description |
|-------|------|-------------|
| audio | file | WebM audio file (recorded speech) |
| session_id | string | Active session UUID |

**Response (200):**
```json
{
  "user_transcript": "transcribed text",
  "response": "AI response text",
  "current_turn_fillers": {"like": 1},
  "total_new_fillers": 1,
  "current_mood": 4,
  "toxicity_score": 0.15,
  "is_toxic": false
}
```

---

## Evaluation

### POST /evaluate
Generate a performance report for a completed session. The optional `duration_sec` is embedded into the stored `evaluation_report` jsonb blob (there is no dedicated column).

**Request:**
```json
{
  "session_id": "uuid",
  "duration_sec": 312
}
```

**Response (200):**
```json
{
  "overall_score": 72,
  "confidence_score": 64,
  "verdict": "LEANING NO HIRE",
  "strengths": ["Took ownership of the issue", "Clear communication"],
  "critical_weaknesses": ["Avoided direct accountability initially"],
  "weak_moments": [
    {
      "turn_index": 4,
      "user_answer": "...",
      "issue": "Vague and defensive",
      "ideal_rewrite": "..."
    }
  ],
  "ideal_rewrites": ["..."],
  "executive_summary": "The user demonstrated...",
  "skills": {
    "composure": 68,
    "structure": 71,
    "evidence": 55,
    "empathy": 60,
    "decisiveness": 74
  },
  "mood_timeline": [5, 4, 6, 7, 6, 8]
}
```

---

## Export

### GET /export/{session_id}
Download a session report as PDF.

**Response:** `application/pdf` file attachment.

---

## Health

### GET /health
Verify backend and dependency connectivity.

**Response (200):**
```json
{
  "status": "online",
  "services": {
    "database": true,
    "groq_api": true
  }
}
```

Returns 503 if any service is unreachable.

---

## Error Format

All errors follow this structure:

```json
{
  "error": "Description of what went wrong"
}
```

Common HTTP status codes: `400` (bad request), `401` (auth missing), `404` (not found), `500` (server error).
