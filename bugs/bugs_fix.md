# Bug Tracker

Log of bugs found during review, and their fixes.

---

## Fixed

### 1. NO HIRE verdict rendered with the warm/positive badge color
**Files:** `frontend/src/pages/Report.jsx`, `frontend/src/pages/Sessions.jsx`, `frontend/src/pages/People.jsx`
**Issue:** Verdict color logic checked `verdict.includes('HIRE')` before checking for `'NO HIRE'`.
Since `"NO HIRE"` and `"LEANING NO HIRE"` both contain the substring `"HIRE"`, they matched the
positive/warm branch first, so a negative verdict displayed in the same green/warm color as a
positive one — on the Report page's main verdict badge, the Sessions list, and the People page's
member session rows.
**Fix:** Check for `'NO HIRE'` first in all three places, and extracted the shared logic into
`frontend/src/lib/verdict.js` (`verdictStyle` / `verdictCssColor`) so the three pages can't drift
out of sync again.

### 2. `sessionsCompleted` counted abandoned sessions with no report
**File:** `frontend/src/lib/supabase.js`
**Issue:** `aggregateAnalytics()` set `sessionsCompleted: sessions.length`, counting every session
row (including ones started and never finished, with no `evaluation_report`). This was inconsistent
with `averageScore` / `bestScore`, which correctly only counted sessions that had a report. It also
affected the Insights page's empty-state check, which could skip the "no data yet" state for users
who only had abandoned sessions.
**Fix:** Changed to `sessionsCompleted: reports.length`, matching the same filtered set used for the
score stats.

---

## Open / to investigate

- `find_user_by_email` in `backend/app/models.py` does a full `list_users()` scan on every invite —
  fine at hackathon scale, would not scale for a large org roster.
- No duplicate-invite / rate-limit guard on `POST /orgs/<org_id>/invite`.
- No automated tests yet for `backend/app/models.py` or `backend/app/engine.py`.
