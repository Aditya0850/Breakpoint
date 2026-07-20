import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { streamChat } from '../lib/api'
import { useSessionStore } from '../store/sessionStore'
import { moodColor } from '../lib/mood'
import PageShell from '../components/layout/PageShell'

/**
 * The confirmed 1-10 mood int is mapped to a color (see lib/mood.js) —
 * this IS the "ambient cue, not a labeled meter" the brief asks for.
 * The number itself is never shown to the user.
 */

function TypingDots() {
  return (
    <div className="flex gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-text-muted"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

export default function Interview() {
  const { sessionId: sessionIdParam } = useParams()
  const navigate = useNavigate()

  const {
    sessionId,
    setup,
    messages,
    currentMood,
    isStreaming,
    streamingText,
    addUserMessage,
    beginAiStream,
    appendAiToken,
    applyMoodUpdate,
    finishAiStream,
  } = useSessionStore()

  const [input, setInput] = useState('')
  const [error, setError] = useState(null)
  const [openingRequested, setOpeningRequested] = useState(false)
  const scrollRef = useRef(null)

  // If the store's session doesn't match the URL (e.g. page refresh),
  // there's no setup data to resume from — send them back to start one.
  const sessionMismatch = !sessionId || sessionId !== sessionIdParam

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streamingText])

  async function runTurn(userText) {
    setError(null)
    beginAiStream()
    try {
      await streamChat(
        { session_id: sessionId, message: userText },
        {
          onToken: appendAiToken,
          onMood: applyMoodUpdate,
        }
      )
    } catch (err) {
      setError(err.message || 'Connection to the interviewer dropped — try again.')
    } finally {
      finishAiStream()
    }
  }

  // ASSUMPTION (unconfirmed): the interviewer's opening question is
  // fetched by sending an empty first message to /api/chat right after
  // /api/start. If the backend instead sends the opener as part of
  // /api/start's response, swap this for reading it off that response
  // in Setup.jsx instead.
  useEffect(() => {
    if (sessionMismatch || openingRequested || messages.length > 0) return
    setOpeningRequested(true)
    runTurn('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionMismatch, openingRequested, messages.length])

  async function handleSend() {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    addUserMessage(text)
    await runTurn(text)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (sessionMismatch) {
    return (
      <PageShell className="flex items-center justify-center">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-semibold mb-2">No active session</h1>
          <p className="text-text-muted text-sm mb-6">
            This interview link isn't tied to a session in progress. Start a new one to continue.
          </p>
          <button
            onClick={() => navigate('/setup')}
            className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-light transition-colors"
          >
            Start a session
          </button>
        </div>
      </PageShell>
    )
  }

  const glow = moodColor(currentMood)

  return (
    <PageShell className="flex flex-col h-screen">
      {/* ambient mood bar — the only visible signal, no number/label */}
      <motion.div
        className="h-[3px] w-full shrink-0"
        animate={{ backgroundColor: glow, boxShadow: `0 0 20px ${glow}` }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />

      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
            {setup?.scenario ?? 'Interview'}
          </p>
          <p className="text-sm text-text-muted mt-0.5">{setup?.context}</p>
        </div>
        <button
          onClick={() => navigate(`/report/${sessionId}`)}
          className="px-4 py-2 rounded-lg border border-border text-sm text-text-muted hover:border-border-light hover:text-text-primary transition-colors"
        >
          End session
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-accent text-white rounded-br-sm'
                    : 'bg-surface border border-border rounded-bl-sm'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {isStreaming && (
            <div className="flex justify-start">
              <div className="bg-surface border border-border rounded-2xl rounded-bl-sm max-w-[80%]">
                {streamingText ? (
                  <p className="px-4 py-3 text-sm leading-relaxed">{streamingText}</p>
                ) : (
                  <TypingDots />
                )}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-mood-cold text-center">{error}</p>}
        </div>
      </div>

      <div className="border-t border-border px-6 py-4 shrink-0">
        <div className="max-w-2xl mx-auto flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder="Type your answer…"
            rows={1}
            className="flex-1 resize-none rounded-lg border border-border bg-surface px-4 py-3 text-sm placeholder:text-text-dim focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="px-5 py-3 rounded-lg bg-accent text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-light transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </PageShell>
  )
}
