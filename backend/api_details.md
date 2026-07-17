# Sentinel Backend API - Technical System Specification

## 1. Overview
Sentinel is an Enterprise HR Simulation Engine. The backend is a Flask-based API using Supabase for authentication/database and Groq (Llama-3) for LLM orchestration.

## 2. Authentication & Security
- **Mechanism**: Supabase JWT authentication[cite: 17].
- **Header Requirement**: Every private route requires: `Authorization: Bearer <JWT_TOKEN>`.
- **RLS**: PostgreSQL Row-Level Security is enabled; backend utilizes a service-role key for internal data management[cite: 14].

## 3. Core API Endpoints

### 3.1 Authentication
- **POST `/api/auth/signup`**: Registers a user and creates a public `profiles` record[cite: 14, 16].
- **POST `/api/auth/login`**: Returns an `access_token` and `user_id`[cite: 16].

### 3.2 Simulation Lifecycle
- **POST `/api/start`**: Creates a session record[cite: 16].
  - *Payload*: `{"scenario": str, "personality": str, "context": str, "brutal": bool}`[cite: 16].
- **POST `/api/chat`**: Handles conversation turns[cite: 16].
  - *Response*: SSE (Server-Sent Events) stream providing chunks of text, followed by metadata (mood updates)[cite: 16].
- **POST `/api/chat/audio`**: Transcribes audio and processes turn[cite: 16].
  - *Payload*: `multipart/form-data` containing `audio` (file) and `session_id`[cite: 16].

### 3.3 Evaluation & Export
- **POST `/api/evaluate`**: Generates a JSON evaluation report based on history[cite: 16].
- **GET `/api/export/<session_id>`**: Returns a binary PDF report generated via WeasyPrint[cite: 16].

### 3.4 Monitoring
- **GET `/api/health`**: Returns status of `database` and `groq_api` dependencies[cite: 16].

## 4. Error Handling Protocol
All errors follow a unified JSON schema for easier frontend parsing:
```json
{
  "status": "error",
  "message": "Error description string",
  "type": "ExceptionClassName"
}
```


## 5. Development Metadata

    - Documentation: Interactive UI available at /apidocs/[cite: 13].

    - Dependency Flow:

        - models.py: Interacts with Supabase[cite: 14].

        - engine.py: Handles Groq LLM calls and mood calculations[cite: 12].

        - routes.py: Orchestrates Flask request handling and auth middleware[cite: 16, 17].
