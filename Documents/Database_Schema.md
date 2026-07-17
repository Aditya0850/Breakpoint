# Database Schema

## profiles

id

email

name

created_at

---

## sessions

id

user_id

role

interview_type

style

difficulty

status

started_at

ended_at

---

## messages

id

session_id

sender

content

turn

created_at

---

## mood_transitions

id

session_id

turn

previous_mood

current_mood

trigger

quality

created_at

---

## evaluations

id

session_id

star_analysis

language_patterns

ideal_rewrites

overall_summary

created_at

---

## uploads

id

session_id

file_type

file_url

created_at

---

Relationships

Profile

↓

Sessions

↓

Messages

↓

Mood Transitions

↓

Evaluation
