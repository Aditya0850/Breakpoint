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
