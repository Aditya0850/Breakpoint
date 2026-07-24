import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { startSession } from '../lib/api'
import { useSessionStore } from '../store/sessionStore'
import PageShell from '../components/layout/PageShell'

const MODES = [
  {
    id: 'interview',
    label: '🎤  Interview Practice',
    desc: 'Prepare for job interviews. The AI acts as an interviewer assessing your fit for a role.',
  },
  {
    id: 'training',
    label: '📋  Workplace Training',
    desc: 'Practice soft skills. The AI acts as a difficult employee, angry customer, pushy vendor, or hostile stakeholder.',
  },
]

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

const TRAINING_STYLES = [
  { id: 'aggressive', label: 'Aggressive / Confrontational', desc: 'Loud, interrupts, demands answers, raises voice' },
  { id: 'defensive', label: 'Defensive / Evasive', desc: 'Deflects blame, avoids answering, makes excuses' },
  { id: 'manipulative', label: 'Manipulative / Political', desc: 'Plays mind games, creates confusion, undermines you' },
  { id: 'detached', label: 'Professional / Detached', desc: 'Cold, formal, strictly by-the-book, no emotional give' },
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

const TRAINING_SCENARIOS = [
  { key: 'Firing an Employee',            label: 'Firing an Employee',             desc: 'Terminate an underperforming employee who pushes back' },
  { key: 'Defending a Technical Architecture', label: 'Defending a Technical Architecture', desc: 'Defend your system design against a skeptical staff engineer' },
  { key: 'Handling a PR Crisis',           label: 'Handling a PR Crisis',            desc: 'Face an aggressive journalist asking about a company scandal' },
  { key: 'Mediating a Team Dispute',       label: 'Mediating a Team Dispute',        desc: 'De-escalate a conflict between two furious team members' },
  { key: 'Negotiating a Vendor Contract',  label: 'Negotiating a Vendor Contract',   desc: 'Negotiate pricing with an uncompromising enterprise sales rep' },
  { key: 'Pushing Back on Scope Creep',    label: 'Pushing Back on Scope Creep',     desc: 'Justify new features to a skeptical PM fighting to protect budget' },
  { key: 'Managing an Active Security Incident', label: 'Managing a Security Incident',    desc: 'Contain an active cyber threat with urgency' },
  { key: 'Resolving a Customer Escalation', label: 'Resolving a Customer Escalation', desc: 'Handle an angry customer demanding immediate action' },
  { key: 'Handling Employee Feedback',     label: 'Handling Employee Feedback',      desc: 'Respond to a sarcastic employee venting about everything wrong' },
  { key: 'Defending a Business Decision',  label: 'Defending a Business Decision',   desc: 'Convince a critical analyst that your strategy is sound' },
  { key: 'Handling a Media Interview',     label: 'Handling a Media Interview',      desc: 'Manage your public image under aggressive questioning' },
  { key: 'Managing a Difficult Stakeholder', label: 'Managing a Difficult Stakeholder', desc: 'Negotiate with an unreasonable vendor making impossible demands' },
  { key: 'Dealing with Office Politics',   label: 'Dealing with Office Politics',    desc: 'Navigate a manipulative colleague sowing discord' },
  { key: 'Handling Regulatory Compliance', label: 'Handling Regulatory Compliance',  desc: 'Ensure company operations meet strict regulatory standards' },
]

const SCENARIO_MAP = {
  'HR Interview':          'Handling Employee Feedback',
  'Technical':             'Defending a Technical Architecture',
  'Behavioral':            'Handling Employee Feedback',
  'Performance Review':    'Handling Employee Feedback',
  'Salary Negotiation':    'Negotiating a Vendor Contract',
  'Promotion Discussion':  'Defending a Business Decision',
  'Difficult Manager':     'Managing a Difficult Stakeholder',
  'Team Conflict':         'Mediating a Team Dispute',
  'Client Meeting':        'Resolving a Customer Escalation',
  'Exit Interview':        'Firing an Employee',
}

const INTERVIEW_STEP_LABELS = ['Pick a mode', 'Choose a role', 'Choose an interview style', 'Set difficulty & type']
const TRAINING_STEP_LABELS = ['Pick a mode', 'Choose a scenario', 'Set personality & difficulty']

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
      className={`text-left text-primary rounded-xl border transition-all duration-150 ${
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

  const [mode, setMode] = useState(null)
  const [step, setStep] = useState(0)

  // Interview fields
  const [role, setRole] = useState(null)
  const [style, setStyle] = useState(null)
  const [difficulty, setDifficulty] = useState(null)
  const [interviewType, setInterviewType] = useState(null)
  const [brutal, setBrutal] = useState(false)

  // Training fields
  const [trainingScenario, setTrainingScenario] = useState(null)
  const [trainingStyle, setTrainingStyle] = useState(null)
  const [trainingDifficulty, setTrainingDifficulty] = useState(null)
  const [trainingContext, setTrainingContext] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const isInterview = mode === 'interview'
  const stepLabels = !mode ? ['Pick a mode'] : isInterview ? INTERVIEW_STEP_LABELS : TRAINING_STEP_LABELS
  const totalSteps = !mode ? 1 : isInterview ? 4 : 3

  const canAdvance = (() => {
    if (step === 0) return !!mode
    if (!mode) return false
    if (isInterview) {
      if (step === 1) return !!role
      if (step === 2) return !!style
      if (step === 3) return !!difficulty && !!interviewType
    } else {
      if (step === 1) return !!trainingScenario
      if (step === 2) return !!trainingStyle && !!trainingDifficulty
    }
    return false
  })()

  const isLastStep = isInterview ? step === 3 : step === 2
  const stepNum = step + 1

  function resetSelections() {
    setRole(null)
    setStyle(null)
    setDifficulty(null)
    setInterviewType(null)
    setBrutal(false)
    setTrainingScenario(null)
    setTrainingStyle(null)
    setTrainingDifficulty(null)
    setTrainingContext('')
    setError(null)
  }

  function pickMode(m) {
    setMode(m)
    setStep(1)
    resetSelections()
  }

  function handleBack() {
    if (step === 0) {
      setMode(null)
      navigate('/dashboard')
    } else if (step === 1) {
      setStep(0)
    } else {
      setStep(step - 1)
    }
  }

  async function handleStart() {
    setSubmitting(true)
    setError(null)

    const setup = isInterview
      ? {
          scenario: SCENARIO_MAP[interviewType] || interviewType,
          personality: style,
          context: `${role} · ${difficulty} level`,
          brutal,
        }
      : {
          scenario: trainingScenario.key,
          personality: trainingStyle,
          context: trainingContext || `${trainingScenario.label} — simulation`,
          brutal: trainingDifficulty === 'Senior',
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
          {stepLabels.map((label, i) => (
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
            key={`${mode || 'mode'}-${step}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Eyebrow>Step {stepNum} of {totalSteps}</Eyebrow>
            <h1 className="text-2xl font-semibold mb-8 tracking-tight">{stepLabels[step]}</h1>

            {/* Step 0: Mode selector */}
            {step === 0 && (
              <div className="flex flex-col gap-3">
                {MODES.map((m) => (
                  <OptionCard key={m.id} selected={mode === m.id} onClick={() => pickMode(m.id)} className="px-5 py-5">
                    <div className="font-semibold text-[1rem] text-[#3c3c87]">{m.label}</div>
                    <div className="text-sm text-primary/70 mt-1 leading-relaxed">{m.desc}</div>
                  </OptionCard>
                ))}
              </div>
            )}

            {/* Interview: Step 1 — role */}
            {isInterview && step === 1 && (
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((r) => (
                  <OptionCard key={r} selected={role === r} onClick={() => setRole(r)} className="px-4 py-3.5">
                    <span className="text-sm">{r}</span>
                  </OptionCard>
                ))}
              </div>
            )}

            {/* Interview: Step 2 — style */}
            {isInterview && step === 2 && (
              <div className="flex flex-col gap-3">
                {STYLES.map((s) => (
                  <OptionCard key={s.id} selected={style === s.id} onClick={() => setStyle(s.id)} className="px-5 py-4">
                    <div className="font-medium text-sm">{s.label}</div>
                    <div className="text-sm text-muted mt-0.5">{s.desc}</div>
                  </OptionCard>
                ))}
              </div>
            )}

            {/* Interview: Step 3 — difficulty + type */}
            {isInterview && step === 3 && (
              <div className="flex flex-col gap-8">
                <div>
                  <p className="text-sm text-muted mb-3">Difficulty</p>
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
                  <p className="text-sm text-muted mb-3">Interview type</p>
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
                    <div className="text-xs text-muted">
                      The interviewer starts skeptical and escalates faster
                    </div>
                  </div>
                </label>
              </div>
            )}

            {/* Training: Step 1 — scenario */}
            {!isInterview && mode && step === 1 && (
              <div className="grid grid-cols-1 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                {TRAINING_SCENARIOS.map((s) => (
                  <OptionCard
                    key={s.key}
                    selected={trainingScenario?.key === s.key}
                    onClick={() => setTrainingScenario(s)}
                    className="px-4 py-3"
                  >
                    <div className="font-medium text-sm">{s.label}</div>
                    <div className="text-xs text-muted mt-0.5">{s.desc}</div>
                  </OptionCard>
                ))}
              </div>
            )}

            {/* Training: Step 2 — personality + difficulty + context */}
            {!isInterview && mode && step === 2 && (
              <div className="flex flex-col gap-8">
                <div>
                  <p className="text-sm text-muted mb-3">Counterpart personality</p>
                  <div className="flex flex-col gap-2.5">
                    {TRAINING_STYLES.map((s) => (
                      <OptionCard
                        key={s.id}
                        selected={trainingStyle === s.id}
                        onClick={() => setTrainingStyle(s.id)}
                        className="px-4 py-3"
                      >
                        <div className="font-medium text-sm">{s.label}</div>
                        <div className="text-xs text-muted mt-0.5">{s.desc}</div>
                      </OptionCard>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted mb-3">Difficulty</p>
                  <div className="flex gap-3">
                    {DIFFICULTIES.map((d) => (
                      <OptionCard
                        key={d}
                        selected={trainingDifficulty === d}
                        onClick={() => setTrainingDifficulty(d)}
                        className="flex-1 px-4 py-2.5 text-center"
                      >
                        <span className="text-sm font-medium">{d}</span>
                      </OptionCard>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted mb-2">Specific context (optional)</p>
                  <textarea
                    value={trainingContext}
                    onChange={(e) => setTrainingContext(e.target.value)}
                    placeholder="Describe the specific situation, e.g. 'The employee has been late 3 times this week and missed a deadline.'"
                    rows={3}
                    className="w-full resize-none rounded-lg border border-border bg-surface px-4 py-3 text-sm placeholder:text-dim focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && <p className="mt-6 text-sm text-mood-cold">{error}</p>}

        <div className="flex items-center justify-between mt-10">
          <button
            onClick={handleBack}
            className="text-sm text-muted hover:text-primary transition-colors"
          >
            ← Back
          </button>

          {!isLastStep ? (
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
              {submitting ? 'Starting…' : isInterview ? 'Start interview' : 'Start training'}
            </button>
          )}
        </div>
      </div>
    </PageShell>
  )
}
