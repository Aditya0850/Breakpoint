import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { fetchSessions, aggregateAnalytics, getProfile, reportOf, endMoodOf } from '../lib/supabase'
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
  const [sessions, setSessions] = useState([])
  const [firstName, setFirstName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const analytics = useMemo(() => aggregateAnalytics(sessions), [sessions])

  const latestSession = useMemo(() => {
    const withReports = sessions.filter((s) => reportOf(s))
    return withReports.length > 0 ? withReports[withReports.length - 1] : null
  }, [sessions])

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchSessions(), getProfile().catch(() => null)])
      .then(([rows, profile]) => {
        if (cancelled) return
        setSessions(rows)
        setFirstName(profile?.first_name ?? '')
      })
      .catch((err) => !cancelled && setError(err.message || 'Could not load your progress.'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const moodData = useMemo(() => {
    return analytics.moodTrend.map((p, i) => ({
      session: i + 1,
      mood: p.endMood,
      date: p.date ? formatDate(p.date) : '',
    }))
  }, [analytics])

  const history = useMemo(() => [...sessions].reverse(), [sessions])

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
            onClick={() => navigate('/scenarios')}
            className="px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-light transition-colors"
          >
            New session
          </button>
        </div>

        {error && (
          <div className="mb-8 rounded-xl border border-mood-cold/30 bg-mood-cold/5 px-5 py-4 text-sm text-mood-cold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Loading your progress…
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <div className="rounded-xl border border-border bg-surface px-4 py-4 hover:border-border-light transition-colors">
                <p className="text-xs text-muted mb-1">📊 Sessions</p>
                <p className="text-xl font-semibold font-mono">{analytics.sessionsCompleted || '—'}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-4 hover:border-border-light transition-colors">
                <p className="text-xs text-muted mb-1">🎯 Avg score</p>
                <p className="text-xl font-semibold font-mono">
                  {analytics.averageScore != null ? analytics.averageScore : '—'}
                  {analytics.averageScore != null && <span className="text-sm text-dim">/100</span>}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-4 hover:border-border-light transition-colors">
                <p className="text-xs text-muted mb-1">⏱ Time practiced</p>
                <p className="text-xl font-semibold font-mono">
                  {analytics.totalMinutes > 0 ? analytics.totalMinutes : '—'}
                  {analytics.totalMinutes > 0 && <span className="text-sm text-dim">m</span>}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-4 hover:border-border-light transition-colors">
                <p className="text-xs text-muted mb-1">🏆 Best score</p>
                <p className="text-xl font-semibold font-mono">
                  {analytics.bestScore != null ? analytics.bestScore : '—'}
                  {analytics.bestScore != null && <span className="text-sm text-dim">/100</span>}
                </p>
              </div>
            </div>

            {latestSession && (
              <div className="rounded-xl border border-border bg-surface px-6 py-5 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-muted">Latest report — {latestSession.scenario}</h2>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: `${verdictColor(reportOf(latestSession).verdict)}15`,
                      color: verdictColor(reportOf(latestSession).verdict),
                    }}
                  >
                    {reportOf(latestSession).verdict ?? '—'}
                  </span>
                </div>

                <div className="flex items-center gap-6 mb-4">
                  <ScoreRing score={reportOf(latestSession).overall_score ?? 0} />
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-dim font-semibold uppercase tracking-wider mb-2">Strengths</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(reportOf(latestSession).strengths ?? []).length > 0
                          ? reportOf(latestSession).strengths.map((s, i) => (
                              <span key={i} className="text-xs px-2 py-1 rounded-md" style={{ background: 'var(--color-mood-warm)15', color: 'var(--color-mood-warm)' }}>{s}</span>
                            ))
                          : <span className="text-xs text-dim">—</span>}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-dim font-semibold uppercase tracking-wider mb-2">Weaknesses</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(reportOf(latestSession).critical_weaknesses ?? []).length > 0
                          ? reportOf(latestSession).critical_weaknesses.map((w, i) => (
                              <span key={i} className="text-xs px-2 py-1 rounded-md" style={{ background: 'var(--color-mood-cold)15', color: 'var(--color-mood-cold)' }}>{w}</span>
                            ))
                          : <span className="text-xs text-dim">—</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {reportOf(latestSession).executive_summary && (
                  <details className="group">
                    <summary className="text-xs text-muted cursor-pointer hover:text-primary transition-colors select-none">
                      Executive summary
                    </summary>
                    <p className="mt-2 text-sm text-primary leading-relaxed">{reportOf(latestSession).executive_summary}</p>
                  </details>
                )}

                <div className="mt-4 pt-4 border-t border-border/60 flex justify-between items-center">
                  <span className="text-xs text-dim">
                    End mood {endMoodOf(latestSession)}/10
                  </span>
                  <button
                    onClick={() => navigate(`/report/${latestSession.id}`)}
                    className="text-sm font-semibold text-accent hover:text-accent-light transition-colors"
                  >
                    View full report →
                  </button>
                </div>
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
                    onClick={() => navigate('/scenarios')}
                    className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-light transition-colors"
                  >
                    Start your first session
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {history.map((session) => {
                    const report = reportOf(session)
                    const score = report?.overall_score
                    const verdict = report?.verdict
                    return (
                      <button
                        key={session.id}
                        onClick={() => navigate(`/report/${session.id}`)}
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
