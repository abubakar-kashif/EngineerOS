# EngineerOS API Contract

## 1. Overview

EngineerOS uses a REST API to allow the React frontend to communicate with the FastAPI backend.

The API uses:

- HTTP
- JSON
- REST-style endpoints

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

## 4. Experiments API

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

## 5. Quiz API

Quizzes are associated with engineering experiments.

### GET `/api/quizzes/{experiment_id}`

Returns the quiz associated with an experiment.

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

Submits quiz answers for an experiment.

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
  "total_questions": 10,
  "correct_answers": 8,
  "passed": true
}
```

The quiz API uses validated request and response schemas. All quiz questions must be answered before submission, and the passing score is 70%.

---

## 6. Progress API

The progress API will track student learning progress.

### GET `/api/progress`

Returns the current learning progress.

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

---


## 7. Reports API

The reports API supports basic engineering lab report records.

### GET `/api/reports`

Returns all available lab reports.

Example response:

```json
[
  {
    "id": 1,
    "experiment_id": "ohms-law",
    "title": "Ohm's Law Experiment",
    "observations": "Measured voltage and current values.",
    "conclusion": "The experimental results followed Ohm's Law.",
    "status": "generated"
  }
]
```

### POST `/api/reports`

Creates a new lab report.

Example request:

```json
{
  "experiment_id": "ohms-law",
  "title": "Ohm's Law Experiment",
  "observations": "Measured voltage and current values.",
  "conclusion": "The experimental results followed Ohm's Law."
}
```

Example response:

```json
{
  "id": 1,
  "experiment_id": "ohms-law",
  "title": "Ohm's Law Experiment",
  "observations": "Measured voltage and current values.",
  "conclusion": "The experimental results followed Ohm's Law.",
  "status": "generated"
}
```

If the provided `experiment_id` does not exist, the API returns:

**404 Not Found**

```json
{
  "detail": "Experiment not found"
}
```

### GET `/api/reports/{report_id}`

Returns a specific lab report.

Example:

```text
GET /api/reports/1
```

Example response:

```json
{
  "id": 1,
  "experiment_id": "ohms-law",
  "title": "Ohm's Law Experiment",
  "observations": "Measured voltage and current values.",
  "conclusion": "The experimental results followed Ohm's Law.",
  "status": "generated"
}
```

If the report does not exist:

**404 Not Found**

```json
{
  "detail": "Report not found"
}
```

---

## 8. Resources API

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


## 9. Future Simulation API

Simulation endpoints are reserved for a later development phase.

Planned endpoints:

```text
POST /api/simulations
GET  /api/simulations/{simulation_id}
POST /api/simulations/{simulation_id}/run
```

These endpoints may eventually support:

- Circuit creation
- Circuit validation
- Simulation execution
- Voltage calculations
- Current calculations
- Waveform generation
- Parameter sweeps
- Simulation results
- Graph generation

These endpoints should not be implemented during the initial website foundation phase.

---

## 10. Future AI API

AI endpoints are reserved for a later development phase.

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

These endpoints should not be implemented during the initial website foundation phase.

---

## 11. HTTP Methods

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

## 12. Response Format

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

## 13. HTTP Status Codes

Common status codes include:

| Status Code | Meaning |
|---|---|
| 200 | Successful request |
| 201 | Resource created |
| 204 | Successful request with no response body |
| 400 | Bad request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Resource not found |
| 422 | Validation error |
| 500 | Internal server error |

The backend should use appropriate status codes for each endpoint.

---

## 14. API Principles

The API should follow these principles:

- Use clear endpoint names.
- Use appropriate HTTP methods.
- Return JSON responses.
- Validate incoming data.
- Return meaningful HTTP status codes.
- Keep frontend and backend responsibilities separated.
- Keep database access inside the backend.
- Do not allow the frontend to access the database directly.
- Keep API contracts documented.
- Update this document when important API contracts change.

---

## 15. Current API Scope

During the initial website foundation phase, development will focus on:

```text
GET  /api/health

GET  /api/experiments
GET  /api/experiments/{experiment_id}

GET  /api/quizzes/{experiment_id}
POST /api/quizzes/{experiment_id}/submit

GET  /api/progress
POST /api/progress

GET  /api/reports
POST /api/reports

GET  /api/resources
GET  /api/resources/{resource_id}
```

Simulation and AI APIs will be implemented in later phases.

---

## 16. API Documentation Policy

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
