# Database Schema

## profiles
Stores user profile information.

| Column       | Type      | Description              |
|--------------|-----------|--------------------------|
| id           | uuid      | Primary key (matches Supabase auth.users) |
| role         | text      | User role (default: "student") |
| created_at   | timestamp | Auto-generated creation timestamp |
| first_name   | text      | User's first name |
| last_name    | text      | User's last name |

---

## sessions
Stores simulation session data.

| Column            | Type      | Description |
|-------------------|-----------|-------------|
| id                | uuid      | Primary key |
| user_id           | uuid      | Foreign key to profiles.id |
| scenario          | text      | Interview type (e.g. "Technical", "Behavioral") |
| context           | text      | Role + difficulty description (e.g. "Design · Senior level") |
| personality       | text      | AI archetype (e.g. "corporate", "aggressive") |
| brutal_mode       | boolean   | Enables brutal honesty mode for senior difficulty |
| current_mood      | integer   | Current AI mood (1–10) |
| mood_timeline     | integer[] | Ordered list of mood values across the conversation |
| history           | jsonb     | Conversation history array [{role, parts}] |
| evaluation_report | jsonb     | Evaluation result from /evaluate endpoint (nullable) |
| created_at        | timestamp | Auto-generated creation timestamp |

---

## Table Relationships

```
profiles
  ↓ (user_id)
sessions
```

The `sessions` table stores the full conversation history and evaluation reports as JSON blobs — no separate messages, evaluations, or mood_transitions tables are needed.

---

## Row Level Security

Both tables have RLS **enabled** and every policy is scoped to the row owner (`auth.uid()`). See `supabase/migrations/0001_enable_rls.sql` for the canonical, idempotent SQL.

| Table | Policy | Operation | Allow when |
|-------|--------|-----------|------------|
| profiles | `profiles_select_own` | SELECT | `auth.uid() = id` |
| profiles | `profiles_insert_own` | INSERT | `auth.uid() = id` |
| profiles | `profiles_update_own` | UPDATE | `auth.uid() = id` |
| sessions | `sessions_select_own` | SELECT | `auth.uid() = user_id` |
| sessions | `sessions_insert_own` | INSERT | `auth.uid() = user_id` |
| sessions | `sessions_update_own` | UPDATE | `auth.uid() = user_id` |
| sessions | `sessions_delete_own` | DELETE | `auth.uid() = user_id` |

Notes:
- The Flask backend uses the **service-role key** (`sb_secret_...`), which bypasses RLS — all server-side writes are unaffected.
- The frontend reads/writes with the publishable key + the signed-in user's JWT, so `auth.uid()` resolves to the current user.
- The frontend never writes `sessions` directly; those policies exist for completeness/parity.
- Duration (`duration_sec`) is stored inside the `evaluation_report` jsonb blob — there is no dedicated column.
