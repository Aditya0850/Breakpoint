import { createClient } from '@supabase/supabase-js'

// Pulled from Vite env — set these in .env.local (never commit real values)
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJ...
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Fails loudly in dev rather than silently breaking auth later.
  console.warn(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — add them to .env.local'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Auth is handled directly against Supabase from the frontend (standard
 * pattern for Supabase apps). The Flask backend never issues its own
 * tokens — it only *validates* the Supabase JWT on protected routes via
 * `Authorization: Bearer <token>`, and uses its service-role key
 * server-side for writes that need to bypass RLS.
 */
export async function signUp({ email, password, first_name, last_name, role }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name, last_name, role }
    }
  })
  if (error) throw error
  return data
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/** Current session's access token, for the Authorization header. */
export async function getToken() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session?.access_token ?? null
}

/* ── Profile ────────────────────────────────────────────────────── */

const PROFILE_FALLBACK_KEY = 'sentinel.profile'

const DEFAULT_PROFILE = {
  first_name: '',
  last_name: '',
  role: 'student',
  default_difficulty: 'Junior',
  default_archetype: '',
  interrupts: true,
  harsh_feedback: true,
}

export async function getProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ...DEFAULT_PROFILE, email: '' }

  const meta = user.user_metadata ?? {}
  const fallback = { ...DEFAULT_PROFILE, ...(readStoredProfile() ?? {}) }

  let row = null
  try {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    row = data
  } catch {
    row = null
  }

  return {
    first_name: row?.first_name ?? meta.first_name ?? fallback.first_name,
    last_name: row?.last_name ?? meta.last_name ?? fallback.last_name,
    role: row?.role ?? meta.role ?? fallback.role,
    email: user.email ?? '',
    default_difficulty: meta.default_difficulty ?? fallback.default_difficulty,
    default_archetype: meta.default_archetype ?? fallback.default_archetype,
    interrupts: meta.interrupts ?? fallback.interrupts,
    harsh_feedback: meta.harsh_feedback ?? fallback.harsh_feedback,
  }
}

export async function saveProfile(profile) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  writeStoredProfile(profile)

  try {
    await supabase
      .from('profiles')
      .upsert({ id: user.id, first_name: profile.first_name, last_name: profile.last_name, role: profile.role })
  } catch {
    /* RLS may restrict direct writes — fall back to auth metadata only */
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      first_name: profile.first_name,
      last_name: profile.last_name,
      role: profile.role,
      default_difficulty: profile.default_difficulty,
      default_archetype: profile.default_archetype,
      interrupts: profile.interrupts,
      harsh_feedback: profile.harsh_feedback,
    },
  })
  if (error) throw error
}

function readStoredProfile() {
  try {
    const raw = window.localStorage.getItem(PROFILE_FALLBACK_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeStoredProfile(profile) {
  try {
    window.localStorage.setItem(PROFILE_FALLBACK_KEY, JSON.stringify(profile))
  } catch {
    /* storage unavailable */
  }
}

/* ── Sessions ───────────────────────────────────────────────────── */

/**
 * Full session rows for the current user — the single source of truth for
 * Dashboard, Sessions and Insights. Matches the backend `sessions` table:
 * id, user_id, scenario, context, personality, brutal_mode, current_mood,
 * mood_timeline, history, evaluation_report, created_at. Duration is stored
 * inside the evaluation_report jsonb blob (see save_evaluation), so it is
 * read from there rather than as a dedicated column.
 */
export async function fetchSessions() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('sessions')
    .select('id, scenario, context, personality, brutal_mode, current_mood, mood_timeline, evaluation_report, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

/* ── Derived analytics (computed from fetchSessions) ────────────── */

export function reportOf(session) {
  const rep = session?.evaluation_report
  return rep && typeof rep === 'object' ? rep : null
}

export function sessionScore(session) {
  return reportOf(session)?.overall_score ?? null
}

export function sessionMinutes(session) {
  const dur = session?.duration_sec ?? reportOf(session)?.duration_sec
  if (dur) return Math.max(1, Math.round(dur / 60))
  return null
}

export function endMoodOf(session) {
  if (session?.current_mood != null) return session.current_mood
  if (Array.isArray(session?.mood_timeline) && session.mood_timeline.length > 0) {
    return session.mood_timeline[session.mood_timeline.length - 1]
  }
  return 5
}

export function aggregateAnalytics(sessions) {
  const reports = sessions.map(reportOf).filter(Boolean)
  const scores = reports.map((r) => r.overall_score).filter((s) => s != null)
  const minutes = sessions.map(sessionMinutes).filter((m) => m != null)

  const typeCounts = {}
  const strongCounts = {}
  const weakCounts = {}
  const skillSums = {}
  const skillCounts = {}

  for (const s of sessions) {
    if (s.scenario) typeCounts[s.scenario] = (typeCounts[s.scenario] ?? 0) + 1
  }
  for (const rep of reports) {
    if (Array.isArray(rep.strengths)) {
      for (const str of rep.strengths) strongCounts[str] = (strongCounts[str] ?? 0) + 1
    }
    if (Array.isArray(rep.critical_weaknesses)) {
      for (const wk of rep.critical_weaknesses) weakCounts[wk] = (weakCounts[wk] ?? 0) + 1
    }
    if (rep.skills && typeof rep.skills === 'object') {
      for (const [skill, value] of Object.entries(rep.skills)) {
        if (typeof value === 'number') {
          skillSums[skill] = (skillSums[skill] ?? 0) + value
          skillCounts[skill] = (skillCounts[skill] ?? 0) + 1
        }
      }
    }
  }

  const topOf = (counts) =>
    Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return {
    sessionsCompleted: sessions.length,
    averageScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    bestScore: scores.length ? Math.max(...scores) : null,
    totalMinutes: minutes.reduce((a, b) => a + b, 0),
    strongestArea: topOf(strongCounts),
    weakestArea: topOf(weakCounts),
    mostPracticedType: topOf(typeCounts),
    moodTrend: sessions.map((s) => ({
      date: s.created_at,
      endMood: endMoodOf(s),
    })),
    skillBreakdown: Object.entries(skillCounts).map(([skill, count]) => ({
      skill: skill.charAt(0).toUpperCase() + skill.slice(1),
      score: Math.round(skillSums[skill] / count),
    })),
    recurringWeaknesses: Object.entries(weakCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([note, count]) => ({ note, count })),
    recurringStrengths: Object.entries(strongCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([note, count]) => ({ note, count })),
  }
}
