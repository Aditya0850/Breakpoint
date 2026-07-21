# Sentinel

> **The AI Workplace Simulator — VibeForge 1.0 Hackathon Submission**

---

## Vision

Sentinel is an AI-powered workplace simulation platform designed to help people prepare for high-pressure professional conversations. Unlike traditional interview preparation tools that ask predefined questions, Sentinel simulates realistic workplace interactions by dynamically adapting its behavior based on the user's responses.

---

## Problem

Most interview preparation platforms fail to recreate the psychological aspects of professional conversations. Existing tools generally ask static questions, provide generic feedback, and behave politely regardless of response quality. Real interviews are different — interviewers become skeptical, interrupt, lose interest, and change their tone. Sentinel focuses on simulating these interactions.

---

## Solution

Sentinel introduces an adaptive AI interviewer powered by a dynamic mood engine. Rather than following a scripted conversation, the AI continuously evaluates user responses and adjusts its emotional state throughout the interview. The AI can become professional, supportive, skeptical, challenging, cold, or encouraging, creating an experience that feels closer to real-world conversations.

---

## Core Flow

Every session consists of three phases:

1. **Setup** — The user configures the scenario (role, interview type, style archetype, difficulty).
2. **Simulation** — The AI interviewer runs the session with dynamic mood shifts (1–10 scale) based on answer quality. Hostile Termination, Technical Defense, PR Crisis, and 11 other scenarios available.
3. **Evaluation** — After the interview, Sentinel generates a detailed report with overall score, verdict, strengths, weaknesses, mood timeline, and executive summary. PDF export available.

---

## Target Users

- Students and fresh graduates
- Job seekers and career switchers
- Professionals preparing for interviews
- Corporate training (future)

---

## Technology

| Layer | Stack |
|-------|-------|
| Frontend | React 19, Vite 8, Tailwind CSS v4, Framer Motion, Zustand, React Query |
| Backend | Flask (Python), Groq SDK (Llama 3.3-70b), spaCy, scikit-learn |
| Database | PostgreSQL via Supabase |
| PDF | WeasyPrint |
| Auth | Supabase Auth (JWT) |

---

## Project Status

**MVP — Complete.** Core simulation, evaluation, and dashboard features are implemented. The project was developed for VibeForge 1.0 Hackathon.
