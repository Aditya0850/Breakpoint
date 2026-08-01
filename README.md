# Breakpoint — Sentinel

An AI-powered workplace simulation platform that prepares you for high-pressure professional conversations. Built with **VibeForge 1.0** — our hackathon submission.

Sentinel doesn't ask scripted questions. A dynamic **mood engine** (1–10 scale) drives an adversarial AI interviewer that gets skeptical, interrupts, pushes back, and reacts to the quality of every answer you give. After each session you get a full report card, mood timeline, and PDF export.

## Features

- **14 realistic scenarios** across 6 categories — terminations, PR crises, vendor negotiations, security incidents, and more
- **Adaptive mood engine** — the AI's emotional state shifts with your answers (hostile ↔ supportive)
- **Brutal mode** — unlocks aggressive interviewer behavior for tougher practice
- **Live interview** — text or voice input, streaming responses (SSE), filler-word detection, toxicity flagging
- **Report card** — overall score, verdict (STRONG HIRE → NO HIRE), strengths/weaknesses, skill bars, weak-moment rewrites, executive summary, PDF export
- **Candidate workspace** — Dashboard (streak, latest report, history), Sessions, Insights (mood trend, skill analytics), Settings
- **Owned-data isolation** — Supabase Row Level Security scopes every row to the signed-in user

## Documentation

- [Project Overview](Documents/Overview.md)
- [API Contract](Documents/api_Contract.md)
- [Database Schema](Documents/Database_Schema.md)
- [Design System](Documents/Design_System.md)
- [Development Guide](Documents/Development_guide.md)
- [Demo Script](Documents/Demo_script.md)
- [Prompt Library](Documents/Prompts.md)

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion, Zustand, React Query, Recharts, shadcn-style components |
| Backend | Flask (Python), Groq (Llama 3.3-70B), Whisper (transcription), scikit-learn (toxicity model) |
| Database | PostgreSQL via Supabase (RLS) |
| Auth | Supabase Auth (email + password, JWT) |
| PDF | WeasyPrint |

## Environment Setup

Create `backend/.env` with the same keys as `backend/.env.example`:

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_KEY=<service-role key, sb_secret_...>
GROQ_API_KEY=<groq key>
GEMINI_API_KEY=<optional>
```

Create `frontend/.env.local` (copy `frontend/.env.example`):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon/publishable key, sb_publishable_...>
VITE_API_BASE_URL=
```

> `VITE_API_BASE_URL` should be **empty** in production (the Flask app serves the built SPA from `backend/static`, so API calls are same-origin). Locally, the Vite dev server proxies `/api` → `http://localhost:5000`, so leave it empty there too.

## Quick Start

```bash
# Backend (http://localhost:5000)
cd backend && uv sync && uv run python run.py

# Frontend (http://localhost:5173)
cd frontend && npm install && npm run dev
```

Open http://localhost:5173, sign up, pick a scenario, and start a session.

- Health check: `GET http://localhost:5000/api/v1/health`
- Swagger UI: `GET http://localhost:5000/apidocs/`

### One-time database step

Apply the RLS migration so users can only see their own data (Supabase Dashboard → SQL Editor → run `supabase/migrations/0001_enable_rls.sql`).

## Deploying to Render

1. Add a **Web Service** pointing at the repo, root directory `/backend`, build command `./render-build.sh`, start command `gunicorn run:app` (see `backend/Procfile`).
2. Set the env vars from `backend/.env` in the Render service.
3. The build installs Python deps, builds the frontend, and copies it into `backend/static/` — Flask serves both the SPA and the API on one origin.

## Scripts

```bash
cd frontend
npm run lint   # oxlint
npm run build  # production build → dist/
```
