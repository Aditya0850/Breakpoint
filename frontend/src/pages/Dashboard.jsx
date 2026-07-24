import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getDashboardStats, getSessionHistory } from '../lib/api'
import { supabase } from '../lib/supabase'
import PageShell from '../components/layout/PageShell'

function Eyebrow({ children }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent mb-1">
      {children}
    </p>
  )
}

function ScoreRing({ score }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={100} height={100}>
        <circle cx={50} cy={50} r={r} fill="none" stroke="var(--color-border)" strokeWidth={6} />
        <motion.circle
          cx={50} cy={50} r={r}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <span className="absolute text-lg font-bold font-mono text-primary">{score}</span>
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function verdictColor(verdict) {
  if (!verdict) return 'var(--color-dim)'
  if (verdict === 'STRONG HIRE' || verdict === 'HIRE') return 'var(--color-mood-warm)'
  if (verdict === 'LEANING NO HIRE') return 'var(--color-mood-neutral)'
  return 'var(--color-mood-cold)'
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [firstName, setFirstName] = useState('')

  const latestReport = useMemo(() => {
    if (!history) return null
    const withReports = history.filter((s) => s.evaluation_report && typeof s.evaluation_report === 'object')
    return withReports.length > 0 ? withReports[0].evaluation_report : null
  }, [history])

  useEffect(() => {
    let cancelled = false
    Promise.all([getDashboardStats(), getSessionHistory()])
      .then(([s, h]) => {
        if (cancelled) return
        setStats(s)
        setHistory(h)
      })
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.user_metadata?.first_name) {
        setFirstName(data.user.user_metadata.first_name)
      }
    })
  }, [])

  const moodData = useMemo(() => {
    if (!stats?.moodTrend) return []
    return stats.moodTrend.map((p, i) => ({
      session: i + 1,
      mood: p.endMood,
      date: p.date ? formatDate(p.date) : '',
    }))
  }, [stats])

  return (
    <PageShell className="px-6 py-14">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Eyebrow>Sentinel</Eyebrow>
            <h1 className="text-2xl font-semibold tracking-tight">
              {greeting()}{firstName ? `, ${firstName}` : ''}
            </h1>
          </div>
          <button
            onClick={() => navigate('/setup')}
            className="px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-light transition-colors"
          >
            New session
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Loading your progress…
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => navigate('/setup')}
                className="rounded-xl border border-border bg-surface px-5 py-6 hover:border-accent/40 transition-colors text-left"
              >
                <span className="text-2xl">🎤</span>
                <p className="text-sm font-semibold text-primary mt-2">Interview Practice</p>
                <p className="text-xs text-muted mt-1">Prepare for job interviews</p>
              </button>
              <button
                onClick={() => navigate('/setup')}
                className="rounded-xl border border-border bg-surface px-5 py-6 hover:border-accent/40 transition-colors text-left"
              >
                <span className="text-2xl">📋</span>
                <p className="text-sm font-semibold text-primary mt-2">Workplace Training</p>
                <p className="text-xs text-muted mt-1">Practice soft skills & scenarios</p>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <div className="rounded-xl border border-border bg-surface px-4 py-4 hover:border-border-light transition-colors">
                <p className="text-xs text-muted mb-1">📊 Sessions</p>
                <p className="text-xl font-semibold font-mono">{stats?.sessionsCompleted ?? '—'}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-4 hover:border-border-light transition-colors">
                <p className="text-xs text-muted mb-1">🏆 Strongest</p>
                <p className="text-sm font-semibold text-primary truncate">{stats?.strongestArea ?? '—'}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-4 hover:border-border-light transition-colors">
                <p className="text-xs text-muted mb-1">⚠️ Weakest</p>
                <p className="text-sm font-semibold text-primary truncate">{stats?.weakestArea ?? '—'}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-4 hover:border-border-light transition-colors">
                <p className="text-xs text-muted mb-1">🎯 Most practiced</p>
                <p className="text-sm font-semibold text-primary truncate">{stats?.mostPracticedType ?? '—'}</p>
              </div>
            </div>

            {latestReport && (
              <div className="rounded-xl border border-border bg-surface px-6 py-5 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-muted">Latest report</h2>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: `${verdictColor(latestReport.verdict)}15`,
                      color: verdictColor(latestReport.verdict),
                    }}
                  >
                    {latestReport.verdict ?? '—'}
                  </span>
                </div>

                <div className="flex items-center gap-6 mb-4">
                  <ScoreRing score={latestReport.overall_score ?? 0} />
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-dim font-semibold uppercase tracking-wider mb-2">Strengths</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(latestReport.strengths ?? []).length > 0
                          ? latestReport.strengths.map((s, i) => (
                              <span key={i} className="text-xs px-2 py-1 rounded-md" style={{ background: 'var(--color-mood-warm)15', color: 'var(--color-mood-warm)' }}>{s}</span>
                            ))
                          : <span className="text-xs text-dim">—</span>}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-dim font-semibold uppercase tracking-wider mb-2">Weaknesses</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(latestReport.critical_weaknesses ?? []).length > 0
                          ? latestReport.critical_weaknesses.map((w, i) => (
                              <span key={i} className="text-xs px-2 py-1 rounded-md" style={{ background: 'var(--color-mood-cold)15', color: 'var(--color-mood-cold)' }}>{w}</span>
                            ))
                          : <span className="text-xs text-dim">—</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {latestReport.executive_summary && (
                  <details className="group">
                    <summary className="text-xs text-muted cursor-pointer hover:text-primary transition-colors select-none">
                      Executive summary
                    </summary>
                    <p className="mt-2 text-sm text-primary leading-relaxed">{latestReport.executive_summary}</p>
                  </details>
                )}
              </div>
            )}

            <div className="mb-10">
              <h2 className="text-sm font-medium text-muted mb-3">Mood improvement trend</h2>
              {moodData.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-5 py-8 text-center text-sm text-dim">
                  Your mood trend will show up here after your first session.
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-surface px-5 py-5">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={moodData} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
                      <XAxis dataKey="session" tick={{ fontSize: 11, fill: 'var(--color-dim)' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[1, 10]} ticks={[1, 3, 5, 7, 10]} tick={{ fontSize: 11, fill: 'var(--color-dim)' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--color-elevated)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 8,
                          fontSize: 12,
                          color: 'var(--color-primary)',
                        }}
                        labelFormatter={(l, p) => p?.[0]?.payload?.date || `Session ${l}`}
                        formatter={(v) => [`${v}/10`, 'Mood']}
                      />
                      <Line
                        type="monotone"
                        dataKey="mood"
                        stroke="var(--color-accent)"
                        strokeWidth={2}
                        dot={{ r: 4, fill: 'var(--color-accent)', strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: 'var(--color-accent-light)', strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-sm font-medium text-muted mb-3">Session history</h2>
              {history.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-5 py-10 text-center">
                  <p className="text-sm text-muted mb-4">
                    You haven't completed a session yet.
                  </p>
                  <button
                    onClick={() => navigate('/setup')}
                    className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-light transition-colors"
                  >
                    Start your first session
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {history.map((session) => {
                    const report = session.evaluation_report
                    const score = report?.overall_score
                    const verdict = report?.verdict
                    return (
                      <button
                        key={session.session_id ?? session.id}
                        onClick={() => navigate(`/report/${session.session_id ?? session.id}`)}
                        className="text-left px-4 py-3 rounded-lg border border-border bg-surface hover:border-border-light transition-colors flex items-center justify-between gap-4"
                        style={{ borderLeftColor: verdict ? verdictColor(verdict) : 'var(--color-border)', borderLeftWidth: 3 }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-primary truncate">{session.scenario ?? 'Session'}</p>
                          <p className="text-xs text-dim">{formatDate(session.created_at)}</p>
                        </div>
                        {score != null && (
                          <span className="text-sm font-semibold font-mono" style={{ color: 'var(--color-accent)' }}>
                            {score}/100
                          </span>
                        )}
                        {verdict && (
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded shrink-0"
                            style={{
                              background: `${verdictColor(verdict)}15`,
                              color: verdictColor(verdict),
                            }}
                          >
                            {verdict}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </PageShell>
  )
}
