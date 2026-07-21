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
 *
 * NOTE: the backend spec also lists POST /api/auth/signup and
 * /api/auth/login. Those appear to be legacy/alternate entry points
 * (e.g. for creating the matching `profiles` row). If your friend
 * confirms the backend expects to own signup, swap the calls below
 * for api.js POST calls instead — everything downstream (getToken)
 * still works the same way.
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

/**
 * Dashboard data — queried directly from Supabase, matching backend models:
 * id, user_id, scenario, context, personality, brutal_mode, current_mood,
 * mood_timeline, history, evaluation_report, created_at.
 */
export async function fetchDashboardStats() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { sessionsCompleted: 0, moodTrend: [], strongestArea: null, weakestArea: null, mostPracticedType: null }

  const { data, error } = await supabase
    .from('sessions')
    .select('scenario, current_mood, mood_timeline, evaluation_report, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) throw error
  const sessions = data ?? []

  const typeCounts = {}
  const strongCounts = {}
  const weakCounts = {}

  for (const s of sessions) {
    if (s.scenario) typeCounts[s.scenario] = (typeCounts[s.scenario] ?? 0) + 1
    const rep = s.evaluation_report
    if (rep && typeof rep === 'object') {
      if (Array.isArray(rep.strengths)) {
        for (const str of rep.strengths) {
          strongCounts[str] = (strongCounts[str] ?? 0) + 1
        }
      }
      if (Array.isArray(rep.critical_weaknesses)) {
        for (const wk of rep.critical_weaknesses) {
          weakCounts[wk] = (weakCounts[wk] ?? 0) + 1
        }
      }
    }
  }

  const topOf = (counts) =>
    Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return {
    sessionsCompleted: sessions.length,
    moodTrend: sessions.map((s) => ({
      date: s.created_at,
      endMood: s.current_mood ?? (Array.isArray(s.mood_timeline) ? s.mood_timeline[s.mood_timeline.length - 1] : 5),
    })),
    strongestArea: topOf(strongCounts),
    weakestArea: topOf(weakCounts),
    mostPracticedType: topOf(typeCounts),
  }
}

/** Session history list — matches backend sessions table schema. */
export async function fetchSessionHistory() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('sessions')
    .select('id, scenario, current_mood, created_at, evaluation_report')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}
