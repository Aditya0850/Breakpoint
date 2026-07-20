import axios from 'axios'
import { getToken } from './supabase'

// No /api/v1 prefix — the real backend spec uses plain /api/*
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export const api = axios.create({ baseURL: BASE_URL })

// Attach the Supabase JWT to every request automatically.
api.interceptors.request.use(async (config) => {
  const token = await getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Backend's unified error shape: { status: "error", message, type }
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const payload = err.response?.data
    const message = payload?.message || err.message || 'Unknown error'
    return Promise.reject(new Error(message))
  }
)

/* ── Simulation lifecycle ─────────────────────────────────────── */

/**
 * POST /api/start
 * payload: { scenario, personality, context, brutal }
 * returns: session record (must include session_id)
 */
export async function startSession(payload) {
  const { data } = await api.post('/api/start', payload)
  return data
}

/**
 * POST /api/chat — SSE stream.
 *
 * CONFIRMED format (from backend author):
 *   data: {"type": "chunk", "text": "..."}
 *   data: {"type": "metadata", "full_text": "...", "filler_analysis": {...}, "new_mood": <int 1-10>}
 * The metadata frame arrives once, at the end of each turn. Mood is a
 * 1-10 integer, not a named state (e.g. "skeptical") — map it to a
 * color/label in the UI layer, not here.
 *
 * @param {object} payload - { session_id, message }
 * @param {(text: string) => void} onToken
 * @param {(meta: { full_text: string, filler_analysis: object, new_mood: number }) => void} onMood
 * @param {AbortSignal} [signal]
 */
export async function streamChat(payload, { onToken, onMood, signal }) {
  const token = await getToken()
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
    signal,
  })

  if (!res.ok || !res.body) {
    const errBody = await res.json().catch(() => null)
    throw new Error(errBody?.message || `Chat request failed (${res.status})`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // SSE frames are separated by a blank line
    const frames = buffer.split('\n\n')
    buffer = frames.pop() // last (possibly incomplete) frame stays in buffer

    for (const frame of frames) {
      const line = frame.trim()
      if (!line.startsWith('data:')) continue
      const jsonStr = line.slice(5).trim()
      if (!jsonStr || jsonStr === '[DONE]') continue

      try {
        const parsed = JSON.parse(jsonStr)
        if (parsed.type === 'metadata') onMood?.(parsed)
        else if (parsed.type === 'chunk') onToken?.(parsed.text ?? '')
      } catch {
        // Fallback: treat as raw text token if it isn't JSON
        onToken?.(jsonStr)
      }
    }
  }
}

/**
 * POST /api/chat/audio — multipart/form-data { audio: File, session_id }
 */
export async function sendAudioTurn({ audioFile, sessionId }) {
  const form = new FormData()
  form.append('audio', audioFile)
  form.append('session_id', sessionId)
  const { data } = await api.post('/api/chat/audio', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

/* ── Evaluation & export ──────────────────────────────────────── */

/** POST /api/evaluate — { session_id } → full evaluation JSON */
export async function evaluateSession(sessionId) {
  const { data } = await api.post('/api/evaluate', { session_id: sessionId })
  return data
}

/** GET /api/export/<session_id> — binary PDF, returned as a Blob */
export async function exportReportPdf(sessionId) {
  const res = await api.get(`/api/export/${sessionId}`, { responseType: 'blob' })
  return res.data // Blob — caller can URL.createObjectURL() it
}

/* ── Dashboard ─────────────────────────────────────────────────── */

/**
 * Dashboard stats and session history are fetched directly from
 * Supabase (not through Flask) — see lib/supabase.js for the query
 * logic and the schema assumptions that still need confirming.
 */
export { fetchDashboardStats as getDashboardStats, fetchSessionHistory as getSessionHistory } from './supabase'

/* ── Monitoring ────────────────────────────────────────────────── */

/** GET /api/health — { database: bool/status, groq_api: bool/status } */
export async function checkHealth() {
  const { data } = await api.get('/api/health')
  return data
}
