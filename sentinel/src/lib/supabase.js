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
export async function signUp({ email, password }) {
  const { data, error } = await supabase.auth.signUp({ email, password })
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
 * Dashboard data — queried directly from Supabase (not through Flask),
 * same pattern as auth. This assumes a `sessions` table shaped roughly
 * like:
 *   id, user_id, scenario, personality, context, brutal,
 *   final_mood, mood_history (jsonb array of {turn, mood}),
 *   strongest_area, weakest_area, created_at, status
 *
 * ⚠️ UNCONFIRMED — these column names are a best guess based on what
 * /api/start's payload and the Mood Engine produce. Check the real
 * schema (Supabase Table Editor, or ask whoever wrote models.py) and
 * adjust the `.select()` / field names below before relying on this.
 */
export async function fetchDashboardStats() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { sessionsCompleted: 0, moodTrend: [], strongestArea: null, weakestArea: null, mostPracticedType: null }

  const { data, error } = await supabase
    .from('sessions')
    .select('scenario, final_mood, mood_history, strongest_area, weakest_area, created_at')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: true })

  if (error) throw error
  const sessions = data ?? []

  const typeCounts = {}
  const strongCounts = {}
  const weakCounts = {}
  for (const s of sessions) {
    if (s.scenario) typeCounts[s.scenario] = (typeCounts[s.scenario] ?? 0) + 1
    if (s.strongest_area) strongCounts[s.strongest_area] = (strongCounts[s.strongest_area] ?? 0) + 1
    if (s.weakest_area) weakCounts[s.weakest_area] = (weakCounts[s.weakest_area] ?? 0) + 1
  }
  const topOf = (counts) =>
    Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return {
    sessionsCompleted: sessions.length,
    moodTrend: sessions.map((s) => ({ date: s.created_at, endMood: s.final_mood })),
    strongestArea: topOf(strongCounts),
    weakestArea: topOf(weakCounts),
    mostPracticedType: topOf(typeCounts),
  }
}

/** Session history list — same `sessions` table, most recent first. */
export async function fetchSessionHistory() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('sessions')
    .select('id, scenario, final_mood, created_at, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}
