# Demo Script

**Length:** ~2 minutes

---

### 0:00 — Landing Page
Show the hero section. Explain the problem: "AI interviewers that actually push back."

---

### 0:15 — Auth
Sign in / Sign up flow (email + password via Supabase).

---

### 0:30 — Setup
Configure a session:
- Role: "Senior Software Engineer"
- Interview type: "Behavioral"
- Style archetype: "Corporate"
- Difficulty: "Senior"

Show the available scenario options.

---

### 0:45 — Live Interview
Start the session. Send a few messages and demonstrate:
- AI responds with adaptive tone
- Mood badge changes (Neutral → Skeptical → Impressed)
- Filler word detection
- SSE streaming

---

### 1:10 — Evaluation
End session → /evaluate. Show the generated report:
- Overall score
- Verdict badge
- Strengths / Weaknesses
- Mood timeline
- Executive summary

---

### 1:30 — Dashboard
- Session history list
- Latest report card
- PDF export

---

### 1:45 — Export PDF
Download the report as PDF via `/api/v1/export/{session_id}`.

---

### 1:55 — Wrap
Mention: "Built for VibeForge 1.0 — fully functional MVP with 14 scenarios."
