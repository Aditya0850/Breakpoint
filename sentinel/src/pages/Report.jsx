import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { evaluateSession, exportReportPdf } from '../lib/api'
import { useSessionStore } from '../store/sessionStore'
import { moodColor } from '../lib/mood'
import PageShell from '../components/layout/PageShell'

function Eyebrow({ children }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent mb-2">
      {children}
    </p>
  )
}

/**
 * Mood timeline — the brief's "oh wow" moment. Renders each turn as a
 * dot on a horizontal line, colored by mood, with a connecting line so
 * the shift over the session is visible at a glance.
 */
function MoodTimeline({ points }) {
  if (!points || points.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-5 py-8 text-center text-sm text-text-dim">
        No mood data recorded for this session.
      </div>
    )
  }

  const w = 600
  const h = 120
  const pad = 24
  const step = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0
  const yFor = (mood) => h - pad - ((mood - 1) / 9) * (h - pad * 2)
  const coords = points.map((p, i) => [pad + i * step, yFor(p.mood)])
  const path = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')

  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-6">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
        <path d={path} fill="none" stroke="var(--color-border-light)" strokeWidth="2" />
        {coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="5" fill={moodColor(points[i].mood)} />
        ))}
      </svg>
      <div className="flex justify-between mt-2 text-xs text-text-dim font-mono">
        <span>Start</span>
        <span>End</span>
      </div>
    </div>
  )
}

function StarBlock({ answer }) {
  const parts = [
    ['Situation', answer.situation],
    ['Task', answer.task],
    ['Action', answer.action],
    ['Result', answer.result],
  ]
  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-4">
      <p className="text-sm font-medium mb-3">{answer.question ?? 'Answer'}</p>
      <div className="grid grid-cols-2 gap-3">
        {parts.map(([label, part]) => (
          <div key={label} className="text-xs">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                part?.present ? 'bg-mood-warm' : 'bg-mood-cold'
              }`}
            />
            <span className="text-text-muted">{label}</span>
            {part?.note && <p className="text-text-dim mt-1 leading-relaxed">{part.note}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function PatternTag({ label, tone }) {
  const toneClass =
    tone === 'warn'
      ? 'border-mood-cold/40 text-mood-cold bg-mood-cold/10'
      : 'border-mood-warm/40 text-mood-warm bg-mood-warm/10'
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${toneClass}`}>
      {tone === 'warn' ? '⚠' : '✓'} {label}
    </span>
  )
}

export default function Report() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const moodHistory = useSessionStore((s) => s.moodHistory)

  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    let cancelled = false
    evaluateSession(sessionId)
      .then((data) => !cancelled && setReport(data))
      .catch((err) => !cancelled && setError(err.message || 'Could not load the report.'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [sessionId])

  async function handleExport() {
    setExporting(true)
    try {
      const blob = await exportReportPdf(sessionId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sentinel-report-${sessionId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message || 'PDF export failed.')
    } finally {
      setExporting(false)
    }
  }

  // Prefer the backend's own timeline if /api/evaluate returns one;
  // otherwise fall back to what was recorded client-side during the
  // live session (lib/store/sessionStore.js moodHistory).
  const timelinePoints = report?.mood_timeline ?? moodHistory

  if (loading) {
    return (
      <PageShell className="flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Generating your report…
        </div>
      </PageShell>
    )
  }

  if (error && !report) {
    return (
      <PageShell className="flex items-center justify-center">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-semibold mb-2">Report unavailable</h1>
          <p className="text-text-muted text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-light transition-colors"
          >
            Back to dashboard
          </button>
        </div>
      </PageShell>
    )
  }

  /**
   * ASSUMPTION (unconfirmed): /api/evaluate's exact response shape.
   * Rendering below expects roughly:
   *   {
   *     overall_summary: string,
   *     star_analysis: [{ question, situation, task, action, result }],
   *     language_patterns: { hedging: [], filler: [], direct_assertions: [], quantified_claims: [] },
   *     ideal_rewrites: [{ original, ideal, reason }],
   *     mood_timeline: [{ mood: number, trigger?: string }],
   *   }
   * Every field below is read with optional chaining and falls back to
   * an empty/placeholder state, so a mismatched shape won't crash the
   * page — but check this against the real response before demo day.
   */
  return (
    <PageShell className="px-6 py-14">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-3xl mx-auto"
      >
        <div className="flex items-center justify-between mb-10">
          <div>
            <Eyebrow>Session report</Eyebrow>
            <h1 className="text-2xl font-semibold tracking-tight">
              {report?.overall_summary ? 'How it went' : 'Report'}
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2.5 rounded-lg border border-border text-sm text-text-muted hover:border-border-light hover:text-text-primary transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold disabled:opacity-40 hover:bg-accent-light transition-colors"
            >
              {exporting ? 'Exporting…' : 'Download PDF'}
            </button>
          </div>
        </div>

        {report?.overall_summary && (
          <p className="text-sm text-text-muted leading-relaxed mb-10">{report.overall_summary}</p>
        )}

        <section className="mb-10">
          <h2 className="text-sm font-medium text-text-muted mb-3">Mood timeline</h2>
          <MoodTimeline points={timelinePoints} />
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-medium text-text-muted mb-3">STAR breakdown</h2>
          {(report?.star_analysis ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-5 py-8 text-center text-sm text-text-dim">
              No STAR analysis available for this session yet.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {report.star_analysis.map((a, i) => (
                <StarBlock key={i} answer={a} />
              ))}
            </div>
          )}
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-medium text-text-muted mb-3">Language patterns</h2>
          <div className="flex flex-wrap gap-2">
            {(report?.language_patterns?.hedging ?? []).map((p, i) => (
              <PatternTag key={`h${i}`} label={p} tone="warn" />
            ))}
            {(report?.language_patterns?.filler ?? []).map((p, i) => (
              <PatternTag key={`f${i}`} label={p} tone="warn" />
            ))}
            {(report?.language_patterns?.direct_assertions ?? []).map((p, i) => (
              <PatternTag key={`d${i}`} label={p} tone="good" />
            ))}
            {(report?.language_patterns?.quantified_claims ?? []).map((p, i) => (
              <PatternTag key={`q${i}`} label={p} tone="good" />
            ))}
            {!report?.language_patterns && (
              <p className="text-sm text-text-dim">No language pattern data available.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium text-text-muted mb-3">Ideal answer rewrites</h2>
          {(report?.ideal_rewrites ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-5 py-8 text-center text-sm text-text-dim">
              No rewrites suggested for this session.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {report.ideal_rewrites.map((r, i) => (
                <div key={i} className="rounded-xl border border-border bg-surface px-5 py-4">
                  <p className="text-xs text-text-dim mb-1">You said</p>
                  <p className="text-sm text-text-muted mb-3">{r.original}</p>
                  <p className="text-xs text-accent mb-1">A stronger answer</p>
                  <p className="text-sm leading-relaxed">{r.ideal}</p>
                  {r.reason && <p className="text-xs text-text-dim mt-2">{r.reason}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </motion.div>
    </PageShell>
  )
}
