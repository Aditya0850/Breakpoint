import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { startSession } from '../lib/api'
import { useSessionStore } from '../store/sessionStore'
import PageShell from '../components/layout/PageShell'

const ROLES = [
  'Software Engineer',
  'Product Manager',
  'Marketing',
  'Finance',
  'Operations',
  'Design',
  'Sales',
  'Data / Analytics',
]

const STYLES = [
  { id: 'startup', label: 'Startup Style', desc: 'Casual, culture-fit heavy' },
  { id: 'corporate', label: 'Corporate Style', desc: 'Structured, formal, competency-based' },
  { id: 'consulting', label: 'Consulting Style', desc: 'Case + behavioral, high pressure' },
  { id: 'product', label: 'Product Style', desc: 'Metrics-driven, product sense' },
]

const DIFFICULTIES = ['Junior', 'Mid', 'Senior']

const INTERVIEW_TYPES = [
  'HR',
  'Technical',
  'Behavioral',
  'Performance Review',
  'Salary Negotiation',
  'Promotion Discussion',
  'Difficult Manager',
  'Team Conflict',
  'Client Meeting',
  'Exit Interview',
]

const STEP_LABELS = ['Choose a role', 'Choose an interview style', 'Set difficulty & type']

function Eyebrow({ children }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent mb-4">
      {children}
    </p>
  )
}

function OptionCard({ selected, onClick, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border transition-all duration-150 ${
        selected
          ? 'border-accent bg-accent/10 shadow-[0_0_0_1px_rgba(110,86,207,0.4)]'
          : 'border-border bg-surface hover:border-border-light hover:bg-elevated'
      } ${className}`}
    >
      {children}
    </button>
  )
}

export default function Setup() {
  const navigate = useNavigate()
  const startStore = useSessionStore((s) => s.startSession)

  const [step, setStep] = useState(0)
  const [role, setRole] = useState(null)
  const [style, setStyle] = useState(null)
  const [difficulty, setDifficulty] = useState(null)
  const [interviewType, setInterviewType] = useState(null)
  const [brutal, setBrutal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const canAdvance =
    (step === 0 && role) ||
    (step === 1 && style) ||
    (step === 2 && difficulty && interviewType)

  async function handleStart() {
    setSubmitting(true)
    setError(null)
    // Confirmed field names: {scenario, personality, context, brutal} —
    // matches exactly what the backend expects, no renaming needed.
    const setup = {
      scenario: interviewType,
      personality: style,
      context: `${role} · ${difficulty} level`,
      brutal,
    }
    try {
      const res = await startSession(setup)
      const sessionId = res.session_id ?? res.id
      startStore({ sessionId, setup })
      navigate(`/interview/${sessionId}`)
    } catch (err) {
      setError(err.message || "Couldn't start the session — try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell className="flex flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl">
        {/* progress */}
        <div className="flex items-center gap-2 mb-10">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="h-1 flex-1 rounded-full bg-border overflow-hidden">
              <motion.div
                className="h-full bg-accent"
                initial={false}
                animate={{ width: i <= step ? '100%' : '0%' }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              />
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Eyebrow>Step {step + 1} of 3</Eyebrow>
            <h1 className="text-2xl font-semibold mb-8 tracking-tight">{STEP_LABELS[step]}</h1>

            {step === 0 && (
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((r) => (
                  <OptionCard key={r} selected={role === r} onClick={() => setRole(r)} className="px-4 py-3.5">
                    <span className="text-sm">{r}</span>
                  </OptionCard>
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-col gap-3">
                {STYLES.map((s) => (
                  <OptionCard key={s.id} selected={style === s.id} onClick={() => setStyle(s.id)} className="px-5 py-4">
                    <div className="font-medium text-sm">{s.label}</div>
                    <div className="text-sm text-text-muted mt-0.5">{s.desc}</div>
                  </OptionCard>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-8">
                <div>
                  <p className="text-sm text-text-muted mb-3">Difficulty</p>
                  <div className="flex gap-3">
                    {DIFFICULTIES.map((d) => (
                      <OptionCard
                        key={d}
                        selected={difficulty === d}
                        onClick={() => setDifficulty(d)}
                        className="flex-1 px-4 py-2.5 text-center"
                      >
                        <span className="text-sm font-medium">{d}</span>
                      </OptionCard>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-text-muted mb-3">Interview type</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {INTERVIEW_TYPES.map((t) => (
                      <OptionCard
                        key={t}
                        selected={interviewType === t}
                        onClick={() => setInterviewType(t)}
                        className="px-3.5 py-2.5"
                      >
                        <span className="text-sm">{t}</span>
                      </OptionCard>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-surface cursor-pointer hover:border-border-light transition-colors">
                  <input
                    type="checkbox"
                    checked={brutal}
                    onChange={(e) => setBrutal(e.target.checked)}
                    className="accent-accent w-4 h-4"
                  />
                  <div>
                    <div className="text-sm font-medium">Brutal mode</div>
                    <div className="text-xs text-text-muted">
                      The interviewer starts skeptical and escalates faster
                    </div>
                  </div>
                </label>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && <p className="mt-6 text-sm text-mood-cold">{error}</p>}

        <div className="flex items-center justify-between mt-10">
          <button
            onClick={() => (step === 0 ? navigate('/dashboard') : setStep(step - 1))}
            className="text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            ← Back
          </button>

          {step < 2 ? (
            <button
              disabled={!canAdvance}
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-light transition-colors"
            >
              Continue
            </button>
          ) : (
            <button
              disabled={!canAdvance || submitting}
              onClick={handleStart}
              className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-light transition-colors"
            >
              {submitting ? 'Starting…' : 'Start interview'}
            </button>
          )}
        </div>
      </div>
    </PageShell>
  )
}
