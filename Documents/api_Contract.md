# API Contract

Base URL

/api/v1

---

## Authentication

POST /auth/signup

POST /auth/login

Bearer Authentication required for all protected routes.

---

## Sessions

POST /sessions/start

Request

{
  role,
  interview_type,
  style_archetype,
  difficulty
}

Response

{
  session_id,
  created_at
}

---

POST /sessions/chat

Request

{
  session_id,
  message
}

Returns

Server Sent Events (SSE)

---

POST /sessions/end

Ends interview.

---

GET /sessions

Returns all previous sessions.

---

GET /sessions/{id}

Returns complete transcript.

---

## Evaluation

POST /evaluate

Returns

STAR Analysis

Language Patterns

Mood Timeline

Ideal Rewrites

Overall Summary

---

## Export

GET /export/{session_id}

Returns PDF.

---

## Health

GET /health

Checks

Database

LLM

Storage

---

# Error Format

{
    "status":"error",
    "message":"",
    "type":""
}

---

# Authentication

Authorization:

Bearer <JWT>

---

# API Versioning

Always use

/api/v1/
