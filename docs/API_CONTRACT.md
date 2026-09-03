# EngineerOS API Contract

## 1. Overview

EngineerOS uses a REST API to allow the React frontend to communicate with the FastAPI backend.

The API uses:

- HTTP
- JSON
- REST-style endpoints

As of Phase 9, the API includes **authentication** (accounts, sessions, email
verification, password reset) and **user-owned data** (preferences,
notifications, AI-Mentor conversations, simulation runs, progress, quiz
attempts, and reports).

The frontend communicates with the backend through defined API endpoints.

The API contract will evolve as features are implemented.

---

## 2. Base URL

Development base URL:

```text
http://127.0.0.1:8000
```

All application endpoints use the `/api` prefix.

Example:

```text
http://127.0.0.1:8000/api/health
```

### Authentication

- Endpoints that require authentication read the `Authorization: Bearer <token>` header.
- Tokens are opaque strings issued by `POST /api/auth/register` and `POST /api/auth/login`.
- Tokens expire after 7 days. Expired or revoked tokens return **401 Unauthorized**.
- Endpoints marked *"requires authentication"* return **401** without a valid token.
- Endpoints marked *"optional authentication"* keep their pre-Phase-9 anonymous
  behaviour when no token is sent, and scope data to the user when one is.

### Development codes (`dev_code`)

There is no mail server in development. When the backend runs with
`DEBUG=true` (the default), endpoints that would email a 6-digit code return
that code in the response as `dev_code`. With `DEBUG=false`, `dev_code` is
always `null`.

### Demo account

When `DEBUG=true`, database seeding creates a pre-verified demo account:

```text
email:    demo@engineeros.dev
password: demo1234
```

### Ownership

Every user-owned resource belongs to exactly one user. Requesting another
user's resource returns **404 Not Found** (indistinguishable from a missing
resource, so resource existence is not leaked).

---

## 3. Health API

### GET `/api/health`

Checks whether the backend is running.

Example response:

```json
{
  "status": "ok",
  "service": "EngineerOS API"
}
```

---

## 4. Authentication API

Accounts, sessions, email verification, and password reset. Passwords are
stored as salted PBKDF2 hashes and are never returned by any endpoint.

### POST `/api/auth/register`

Creates an account, signs it in, and issues an email-verification code.

Request:

```json
{
  "name": "Fatima",
  "email": "fatima@example.com",
  "password": "at-least-8-chars"
}
```

Response **201**:

```json
{
  "user": { "...": "UserResponse — see below" },
  "token": "9fKxQ3v...",
  "dev_code": "418252"
}
```

Errors:

- **409** — an account with this email already exists
- **422** — invalid name, email, or password (minimum 8 characters)

### POST `/api/auth/login`

Signs in with email and password.

Request:

```json
{
  "email": "fatima@example.com",
  "password": "at-least-8-chars"
}
```

Response **200**: same shape as the register response (without `dev_code`).

Errors:

- **401** — `{"detail": "Incorrect email or password."}`
  (identical for unknown email and wrong password — no account enumeration)

### GET `/api/auth/me`

Returns the current account. **Requires authentication.** This is the single
reliable source of identity consumed by the frontend `AuthContext` (profile,
preferences, and live sessions in one request).

Response **200**: same shape as the login response; `token` echoes the
submitted token.

Errors:

- **401** — missing, invalid, expired, or revoked token

### POST `/api/auth/logout`

Revokes the current session. **Requires authentication.**

Response **200**:

```json
{
  "message": "Signed out successfully."
}
```

### POST `/api/auth/verify`

Verifies the account email with a 6-digit code.

Request:

```json
{
  "email": "fatima@example.com",
  "code": "418252"
}
```

Response **200**:

```json
{
  "message": "Email verified successfully."
}
```

Errors:

- **400** — invalid or expired code
- **404** — no account with this email

### POST `/api/auth/resend`

Issues a new verification code.

Request:

```json
{
  "email": "fatima@example.com"
}
```

Response **200**:

```json
{
  "message": "Verification code sent.",
  "dev_code": "418252"
}
```

Errors:

- **404** — no account with this email
- **409** — email already verified

### POST `/api/auth/forgot`

Requests a password reset code. The response is identical whether or not the
account exists, so accounts cannot be enumerated (in DEBUG mode the presence
of `dev_code` does reveal existing accounts — a development-only trade-off).

Request:

```json
{
  "email": "fatima@example.com"
}
```

Response **200**:

```json
{
  "message": "If an account exists with this email, a reset code has been sent.",
  "dev_code": "418252"
}
```

### POST `/api/auth/reset`

Completes a password reset with the 6-digit code. Rotates the password and
revokes **every** active session for the account.

Request:

```json
{
  "token": "418252",
  "password": "new-at-least-8-chars"
}
```

Response **200**:

```json
{
  "message": "Password has been reset successfully."
}
```

Errors:

- **400** — invalid or expired reset code
- **422** — password shorter than 8 characters

### UserResponse shape

Shared by register, login, and `/api/auth/me`:

```json
{
  "id": "9d4c2a1b7f0e4d2c8a6b3d5e",
  "name": "Fatima",
  "email": "fatima@example.com",
  "avatar_url": null,
  "email_verified": true,
  "created_at": "2026-08-28T10:00:00",
  "preferences": {
    "theme": "dark",
    "preferred_difficulty": "Beginner",
    "learning_reminders": false,
    "default_experiment_view": "overview",
    "notify_quiz_results": true,
    "notify_report_completion": true,
    "notify_learning_reminders": false
  },
  "sessions": [
    {
      "id": "c1d2...",
      "created_at": "2026-08-28T10:00:00",
      "expires_at": "2026-09-04T10:00:00",
      "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...",
      "current": true
    }
  ]
}
```

---

## 5. Users API

Profile, password, and account preferences. All endpoints **require
authentication**.

### GET `/api/users/me`

Returns the current account (same shape as `UserResponse` above).

### PATCH `/api/users/me`

Updates profile fields. Both fields are optional; only provided fields change.

Request:

```json
{
  "name": "Fatima W.",
  "avatar_url": "https://example.com/avatar.png"
}
```

Response **200**: `UserResponse`.

Errors: **422** — blank name or oversized values.

### PUT `/api/users/me/password`

Changes the account password. The current session stays valid; all other
sessions are revoked.

Request:

```json
{
  "current_password": "at-least-8-chars",
  "new_password": "new-at-least-8-chars"
}
```

Response **200**:

```json
{
  "message": "Password updated successfully. 2 other session(s) were signed out."
}
```

Errors:

- **400** — `{"detail": "Your current password is incorrect."}`
- **422** — new password shorter than 8 characters

### DELETE `/api/users/me/sessions`

Signs out every session **except** the one making the request (used by the
Security settings page's "Sign Out Other Sessions" action).

Response **200**:

```json
{
  "message": "Signed out 2 other session(s)."
}
```

When there are no other active sessions the message is
`"No other active sessions found."`.

### GET `/api/users/me/preferences`

Returns the account preferences.

Response **200**:

```json
{
  "theme": "dark",
  "preferred_difficulty": "Beginner",
  "learning_reminders": false,
  "default_experiment_view": "overview",
  "notify_quiz_results": true,
  "notify_report_completion": true,
  "notify_learning_reminders": false
}
```

### PATCH `/api/users/me/preferences`

Partially updates preferences — only provided fields change. The `theme`
field (`light` | `dark` | `system`) is the persisted, account-level theme used
by the frontend on next login.

Request:

```json
{
  "theme": "light",
  "notify_quiz_results": false
}
```

Response **200**: full `PreferencesResponse`.

---

## 6. Notifications API

Persisted notifications for the signed-in user, newest first (maximum 50
listed). All endpoints **require authentication**.

Notification types produced by the backend: `welcome`, `quiz_result`,
`report`.

### GET `/api/notifications`

Response **200**:

```json
{
  "items": [
    {
      "id": 2,
      "type": "quiz_result",
      "title": "Quiz results ready",
      "message": "You scored 100% on Ohm's Law — passed.",
      "read": false,
      "metadata": {
        "experiment_id": "ohms-law",
        "attempt_id": 1,
        "score": 100.0,
        "passed": true
      },
      "created_at": "2026-08-28T10:05:00"
    }
  ],
  "unread_count": 1,
  "total": 2
}
```

### POST `/api/notifications/{notification_id}/read`

Marks one notification as read.

Response **200**: the updated `NotificationResponse`.

Errors: **404** — notification not found (or owned by another user).

### POST `/api/notifications/read-all`

Marks all notifications as read.

Response **200**:

```json
{
  "message": "Marked 3 notification(s) as read.",
  "updated": 3
}
```

---

## 7. Experiments API

Experiments are one of the core resources of EngineerOS.

### GET `/api/experiments`

Returns the available engineering experiments.

Example response:

```json
[
  {
    "id": "ohms-law",
    "title": "Ohm's Law",
    "slug": "ohms-law",
    "short_description": "Explore the relationship between voltage, current, and resistance.",
    "difficulty": "Beginner",
    "category": "Circuit Fundamentals",
    "duration_minutes": 30
  }
]
```

### GET `/api/experiments/{experiment_id}`

Returns information about a specific experiment.

Example:

```text
GET /api/experiments/ohms-law
```

Example response:

```json
{
  "id": "ohms-law",
  "title": "Ohm's Law",
  "slug": "ohms-law",
  "short_description": "Explore the relationship between voltage, current, and resistance.",
  "difficulty": "Beginner",
  "category": "Circuit Fundamentals",
  "duration_minutes": 30
}
```

### Initial Experiment IDs

The initial experiment system is planned around:

```text
ohms-law
series-circuit
parallel-circuit
kvl
kcl
voltage-divider
current-divider
rc-circuit
diode-characteristics
led-circuit
```

Additional experiments may be added later.

---

## 8. Quiz API

Quizzes are associated with engineering experiments. Each experiment has a
40-question bank; clients present a random 20-question attempt per quiz run
(`QUIZ_ATTEMPT_SIZE = 20`).

### GET `/api/quizzes/{experiment_id}`

Returns the full question bank for an experiment (the client samples a
random 20-question attempt from it).

Example:

```text
GET /api/quizzes/ohms-law
{
  "experiment_id": "ohms-law",
  "questions": [
    {
      "id": 1,
      "experiment_id": "ohms-law",
      "question": "What is the relationship between voltage, current, and resistance?",
      "option_a": "V = I × R",
      "option_b": "V = I / R",
      "option_c": "V = R / I",
      "option_d": "V = I + R"
    }
  ]
}
```

### POST `/api/quizzes/{experiment_id}/submit`

Submits quiz answers for an experiment. **Optional authentication.** The
submission represents one attempt: a random 20-question sample of the bank
(full-bank submissions from older clients remain valid).

Example request structure:

```json
{
  "answers": [
    {
      "question_id": 1,
      "answer": "B"
    }
  ]
}
```

Example response:

```json
{
  "score": 80.0,
  "total_questions": 20,
  "correct_answers": 16,
  "passed": true
}
```

Behaviour:

- A submission must cover a complete attempt — at least 20 questions (the
  whole bank when it is smaller); the score is graded over the submitted
  answers and the passing score is 70%.
- **Authenticated** submissions are persisted as a quiz attempt (answers +
  grade), trigger a `quiz_result` notification (unless disabled in
  preferences), and — when passed — mark the experiment as `completed` in the
  user's progress (Quiz → Attempt → Score → Progress).
- **Anonymous** submissions are graded but not recorded, exactly as before
  Phase 9.

Errors:

- **400** — empty answers, duplicate question IDs, unknown question IDs, or
  fewer answers than a complete attempt
- **404** — no quiz for this experiment

---

## 9. Progress API

Tracks student learning progress. **Optional authentication** on the summary
and upsert endpoints.

### GET `/api/progress`

Returns the learning progress summary.

- **Authenticated**: the user's own completed experiments plus quiz
  statistics derived from their recorded quiz attempts.
- **Anonymous**: pre-Phase-9 global behaviour (ownerless rows; quiz
  statistics stay at zero because anonymous submissions are not recorded).

Example response:

```json
{
  "completed_experiments": 3,
  "completed_quizzes": 2,
  "average_quiz_score": 85.0,
  "overall_progress": 30.0
}
```

### POST `/api/progress`

Creates or updates learning progress for an experiment.

- **Authenticated**: creates or updates the user's own row for the experiment.
- **Anonymous**: updates the shared ownerless row, as before Phase 9.

Example request:

```json
{
  "experiment_id": "ohms-law",
  "status": "completed"
}
```

Example response:

```json
{
  "id": 1,
  "experiment_id": "ohms-law",
  "status": "completed"
}
```

If the provided `experiment_id` does not exist, the API returns:

**404 Not Found**

```json
{
  "detail": "Experiment not found"
}
```

The progress API supports the following statuses:

* `in_progress`
* `completed`

Posting progress for the same experiment updates the existing progress record rather than creating a duplicate record.

### GET `/api/progress/me`

Per-experiment progress rows for the signed-in user. **Requires
authentication.**

Response **200**:

```json
[
  {
    "id": 1,
    "experiment_id": "ohms-law",
    "status": "completed"
  }
]
```

Errors: **401** — not authenticated.

---

## 10. Reports API

Lab report records. **Optional authentication.**

A report is a snapshot of a full engineering lab document: content sections
(objective, historical background, theory, components, circuit diagram,
procedure, theoretical results) are copied from the experiment at generation
time; measured values are pulled from the user's latest simulation run;
calculated results and percentage error are computed from that real data; and
quiz performance comes from the user's latest quiz attempt. **Anything
without a real source is `null` — missing measurements are never fabricated.**

Ownership rules:

- **Authenticated**: reports are created with the user's id and the user's
  name; the list shows only the user's own reports (newest first); fetching
  another user's report returns **404**. Simulation measurements and quiz
  performance attach only for authenticated users (both are user-owned).
- **Anonymous**: ownerless reports only, exactly as before Phase 9 — content
  sections and user-supplied observations/conclusion only.

### GET `/api/reports`

Returns the visible lab reports.

Example response:

```json
[
  {
    "id": 1,
    "user_id": "9d4c2a1b7f0e4d2c8a6b3d5e",
    "experiment_id": "ohms-law",
    "experiment_title": "Ohm's Law",
    "student_name": "Ada Lovelace",
    "title": "Lab Report — Ohm's Law",
    "objective": "Understand how voltage, current, and resistance are related.",
    "theory": "Ohm's Law states that voltage equals current multiplied by resistance.",
    "historical_background": "Georg Ohm published the law in 1827.",
    "components": [{"name": "Resistor 1 kΩ", "quantity": 1, "spec": "1/4 W"}],
    "circuit_diagram": {"art": " +--[R1]--\n |       |\n(V)      |\n |       |\n +-------+", "caption": "Series circuit"},
    "procedure": ["Connect the resistor.", "Measure the current."],
    "theoretical_results": {
      "reference_values": [
        {"label": "Source Voltage", "value": 9, "unit": "V"},
        {"label": "Total Resistance", "value": 1000, "unit": "Ω"},
        {"label": "Total Current", "value": 0.009, "unit": "A"},
        {"label": "Total Power", "value": 0.081, "unit": "W"}
      ],
      "expected_outcomes": ["Current follows I = V / R."]
    },
    "measured_results": [
      {"label": "Source Voltage", "value": 9, "unit": "V"},
      {"label": "R1 Voltage", "value": 9, "unit": "V"}
    ],
    "calculated_results": [
        {"label": "Total Resistance", "value": 1000, "unit": "Ω", "formula": "R = V / I"},
        {"label": "Total Power", "value": 0.081, "unit": "W", "formula": "P = V × I"}
    ],
    "percentage_error": [
      {"label": "Total Current", "theoretical": 0.009, "measured": 0.009, "unit": "A", "error_percent": 0.0}
    ],
    "quiz_performance": {"score": 85.0, "correct_answers": 17, "total_questions": 20, "passed": true},
    "observations": "Measured voltage and current values.",
    "conclusion": "The experimental results followed Ohm's Law.",
    "status": "generated",
    "created_at": "2026-08-28T10:10:00"
  }
]
```

All lab-document fields except `id`, `experiment_id`, `title`, `observations`,
`conclusion`, `status`, and `created_at` are `null` when their real data
source does not exist (no simulation run, no quiz attempt, no reference
configuration, or an anonymous request).

### POST `/api/reports`

Creates a new lab report. Only `observations` and `conclusion` come from the
request — the rest of the document is assembled server-side as described
above. When authenticated, a `report` notification is created (unless
disabled in preferences).

Example request:

```json
{
  "experiment_id": "ohms-law",
  "title": "Ohm's Law Experiment",
  "observations": "Measured voltage and current values.",
  "conclusion": "The experimental results followed Ohm's Law."
}
```

Response **201**: the created report (same shape as the list items above).

If the provided `experiment_id` does not exist, the API returns:

**404 Not Found**

```json
{
  "detail": "Experiment not found"
}
```

### GET `/api/reports/{report_id}`

Returns a specific visible lab report.

Example:

```text
GET /api/reports/1
```

If the report does not exist (or belongs to another user):

**404 Not Found**

```json
{
  "detail": "Report not found"
}
```

---

## 11. Resources API

The resources API provides engineering learning resources.

### GET `/api/resources`

Returns all available learning resources.

Example response:

```json
{
  "items": [
    {
      "id": "ohms-law-notes",
      "title": "Ohm's Law Notes",
      "type": "document",
      "description": "Engineering notes covering voltage, current, resistance, and Ohm's Law.",
      "url": null
    }
  ],
  "total": 4
}
```

### GET `/api/resources/{resource_id}`

Returns a specific learning resource.

Example:

```text
GET /api/resources/ohms-law-notes
```

Example response:

```json
{
  "id": "ohms-law-notes",
  "title": "Ohm's Law Notes",
  "type": "document",
  "description": "Engineering notes covering voltage, current, resistance, and Ohm's Law.",
  "url": null
}

```

If the resource does not exist:

**404 Not Found**

```json
{
  "detail": "Resource not found"
}
```

---

## 12. Conversations API (AI Mentor persistence)

Persisted AI-Mentor conversations and messages. This is the storage
foundation only — no LLM integration in Phase 9. All endpoints **require
authentication**, and every operation is scoped to the owning user.

### GET `/api/conversations`

Lists the user's conversations (most recently updated first).

Response **200**:

```json
[
  {
    "id": "b1e2...",
    "title": "Ohm's Law help",
    "experiment_id": "ohms-law",
    "created_at": "2026-08-28T10:00:00",
    "updated_at": "2026-08-28T10:05:00",
    "message_count": 4
  }
]
```

### POST `/api/conversations`

Creates a conversation. Both fields are optional; the title defaults to
`"New conversation"`.

Request:

```json
{
  "title": "Ohm's Law help",
  "experiment_id": "ohms-law"
}
```

Response **201**: conversation detail with empty `messages`.

### GET `/api/conversations/{conversation_id}`

Returns one conversation including its messages (ordered by creation time).

Errors: **404** — conversation not found (or owned by another user).

### PATCH `/api/conversations/{conversation_id}`

Renames a conversation.

Request: `{"title": "New title"}`

Response **200**: conversation summary.

### DELETE `/api/conversations/{conversation_id}`

Deletes a conversation and its messages.

Response **204** (no body).

### GET `/api/conversations/{conversation_id}/messages`

Returns the conversation's messages.

Response **200**:

```json
[
  {
    "id": "m1e2...",
    "conversation_id": "b1e2...",
    "role": "user",
    "content": "What is Ohm's law?",
    "feedback": null,
    "metadata": {},
    "created_at": "2026-08-28T10:01:00"
  }
]
```

### POST `/api/conversations/{conversation_id}/messages`

Appends a message. `role` is `user`, `assistant`, or `system`; `metadata` is
an optional free-form object.

Request:

```json
{
  "role": "user",
  "content": "What is Ohm's law?",
  "metadata": {"source": "mentor-page"}
}
```

Response **201**: the created message.

### PATCH `/api/conversations/{conversation_id}/messages/{message_id}`

Sets feedback on a message. `feedback` is `helpful`, `not_helpful`, or
`null` (to clear).

Request: `{"feedback": "helpful"}`

Response **200**: the updated message.

Errors: **404** — message or conversation not found (or owned by another user).

---

## 13. Simulation Runs API

Persistence foundation for circuit simulation runs — runs store a circuit
configuration and lifecycle status only; **no solving engine is implemented
in Phase 9**. All endpoints **require authentication**.

Statuses: `created`, `running`, `completed`, `failed`.

### GET `/api/simulations`

Lists the user's simulation runs, newest first. Optional query parameter
`experiment_id` filters by experiment.

Response **200**:

```json
[
  {
    "id": "s1e2...",
    "user_id": "9d4c2a1b7f0e4d2c8a6b3d5e",
    "experiment_id": "ohms-law",
    "configuration": {"voltage": 9, "resistance": 100},
    "status": "completed",
    "created_at": "2026-08-28T10:00:00",
    "completed_at": "2026-08-28T10:02:00"
  }
]
```

### POST `/api/simulations`

Creates a run.

Request:

```json
{
  "experiment_id": "ohms-law",
  "configuration": {"voltage": 9, "resistance": 100},
  "status": "created"
}
```

Response **201**: the created run.

### GET `/api/simulations/{run_id}`

Returns one run. Errors: **404** — run not found (or owned by another user).

### PATCH `/api/simulations/{run_id}`

Updates a run. Setting `"completed": true` stamps `completed_at`.

Request:

```json
{
  "status": "completed",
  "completed": true
}
```

Response **200**: the updated run.

---

## 14. Future AI API

LLM-powered endpoints remain reserved for a later development phase (the
conversation storage above is deliberately model-free).

Planned endpoints:

```text
POST /api/ai/chat
POST /api/ai/explain
POST /api/ai/generate-circuit
POST /api/ai/modify-circuit
```

Future AI functionality may include:

- Engineering explanations
- Step-by-step guidance
- Troubleshooting
- Circuit assistance
- Result interpretation
- AI-generated quizzes
- Lab report assistance
- Personalized learning assistance

---

## 15. HTTP Methods

EngineerOS follows standard HTTP methods.

| Method | Purpose |
|---|---|
| GET | Retrieve data |
| POST | Create or submit data |
| PUT | Replace existing data |
| PATCH | Partially update data |
| DELETE | Remove data |

Only the methods required by a particular resource should be implemented.

---

## 16. Response Format

Successful responses should use JSON.

Example:

```json
{
  "id": "example",
  "status": "success"
}
```

Error responses should provide a meaningful message.

Example:

```json
{
  "detail": "Experiment not found."
}
```

---

## 17. HTTP Status Codes

Common status codes include:

| Status Code | Meaning |
|---|---|
| 200 | Successful request |
| 201 | Resource created |
| 204 | Successful request with no response body |
| 400 | Bad request |
| 401 | Unauthorized (missing/invalid/expired token) |
| 403 | Forbidden |
| 404 | Resource not found (or not owned by the requester) |
| 409 | Conflict (duplicate email, already verified) |
| 422 | Validation error |
| 500 | Internal server error |

The backend should use appropriate status codes for each endpoint.

---

## 18. API Principles

The API should follow these principles:

- Use clear endpoint names.
- Use appropriate HTTP methods.
- Return JSON responses.
- Validate incoming data.
- Return meaningful HTTP status codes.
- Keep frontend and backend responsibilities separated.
- Keep database access inside the backend.
- Do not allow the frontend to access the database directly.
- Never store or return plaintext passwords.
- Enforce ownership on every user-owned resource (404 for other users' data).
- Keep API contracts documented.
- Update this document when important API contracts change.

---

## 19. Current API Scope

Endpoints implemented as of Phase 9:

```text
# Health
GET  /api/health

# Authentication
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me                  (requires authentication)
POST /api/auth/logout              (requires authentication)
POST /api/auth/verify
POST /api/auth/resend
POST /api/auth/forgot
POST /api/auth/reset

# Users (require authentication)
GET    /api/users/me
PATCH  /api/users/me
PUT    /api/users/me/password
DELETE /api/users/me/sessions
GET    /api/users/me/preferences
PATCH  /api/users/me/preferences

# Notifications (require authentication)
GET  /api/notifications
POST /api/notifications/{notification_id}/read
POST /api/notifications/read-all

# Conversations (require authentication)
GET    /api/conversations
POST   /api/conversations
GET    /api/conversations/{conversation_id}
PATCH  /api/conversations/{conversation_id}
DELETE /api/conversations/{conversation_id}
GET    /api/conversations/{conversation_id}/messages
POST   /api/conversations/{conversation_id}/messages
PATCH  /api/conversations/{conversation_id}/messages/{message_id}

# Simulation runs (require authentication)
GET   /api/simulations?experiment_id={id}
POST  /api/simulations
GET   /api/simulations/{run_id}
PATCH /api/simulations/{run_id}

# Experiments
GET  /api/experiments
GET  /api/experiments/{experiment_id}

# Quizzes (optional authentication)
GET  /api/quizzes/{experiment_id}
POST /api/quizzes/{experiment_id}/submit

# Progress
GET  /api/progress                 (optional authentication)
POST /api/progress                 (optional authentication)
GET  /api/progress/me              (requires authentication)

# Reports (optional authentication)
GET  /api/reports
POST /api/reports
GET  /api/reports/{report_id}

# Resources
GET  /api/resources
GET  /api/resources/{resource_id}
```

LLM-powered AI endpoints will be implemented in later phases.

---

## 20. API Documentation Policy

Whenever a new API endpoint becomes part of the project:

1. Define the endpoint.
2. Define the HTTP method.
3. Define request data if required.
4. Define response data.
5. Define important error responses.
6. Update this document.
7. Implement backend tests.
8. Integrate the frontend only after the contract is understood.

The API contract should remain understandable to all team members.
