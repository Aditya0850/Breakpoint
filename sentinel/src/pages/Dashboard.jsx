import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getDashboardStats, getSessionHistory } from '../lib/api'
import PageShell from '../components/layout/PageShell'

function Eyebrow({ children }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent mb-1">
      {children}
    </p>
  )
}

function StatBlock({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-4 hover:border-border-light transition-colors">
      <p className="text-xs text-text-muted mb-1.5">{label}</p>
      <p className="text-xl font-semibold font-mono">{value ?? '—'}</p>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([getDashboardStats(), getSessionHistory()])
      .then(([s, h]) => {
        if (cancelled) return
        setStats(s)
        setHistory(h)
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <PageShell className="px-6 py-14">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <Eyebrow>Sentinel</Eyebrow>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          </div>
          <button
            onClick={() => navigate('/setup')}
            className="px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-light transition-colors"
          >
            New session
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Loading your progress…
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
              <StatBlock label="Sessions completed" value={stats.sessionsCompleted} />
              <StatBlock label="Strongest area" value={stats.strongestArea} />
              <StatBlock label="Weakest area" value={stats.weakestArea} />
              <StatBlock label="Most practiced" value={stats.mostPracticedType} />
            </div>

            <div className="mb-10">
              <h2 className="text-sm font-medium text-text-muted mb-3">Mood improvement trend</h2>
              {stats.moodTrend.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-5 py-8 text-center text-sm text-text-dim">
                  Your mood trend will show up here after your first session.
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-surface px-5 py-4 text-sm text-text-muted font-mono">
                  {/* TODO: real chart once moodTrend shape is confirmed against backend */}
                  {stats.moodTrend.length} data points
                </div>
              )}
            </div>

            <div>
              <h2 className="text-sm font-medium text-text-muted mb-3">Session history</h2>
              {history.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-5 py-10 text-center">
                  <p className="text-sm text-text-muted mb-4">
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
                  {history.map((session) => (
                    <button
                      key={session.session_id ?? session.id}
                      onClick={() => navigate(`/report/${session.session_id ?? session.id}`)}
                      className="text-left px-4 py-3 rounded-lg border border-border bg-surface hover:border-border-light transition-colors flex items-center justify-between"
                    >
                      <span className="text-sm">{session.scenario ?? 'Session'}</span>
                      <span className="text-xs text-text-dim font-mono">{session.created_at ?? ''}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </PageShell>
  )
}
