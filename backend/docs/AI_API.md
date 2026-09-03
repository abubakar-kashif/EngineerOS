# EngineerOS AI Mentor API Documentation

## Overview

The AI Mentor API provides conversational AI assistance for electrical engineering learning. It supports persistent conversations, context-aware answers, and streaming responses.

## Base URL
http://localhost:8000/conversations

text

## Authentication

Currently uses `user_id` as a query parameter. This is temporary and will be replaced with proper authentication.
user_id: str (required)

text

---

## Endpoints

### 1. Create a Conversation

**POST** `/conversations/`

**Request Body:**
```json
{
  "title": "Ohm's Law Discussion",
  "user_id": "user-123"
}
Response (200 OK):

json
{
  "id": "conv-456",
  "user_id": "user-123",
  "title": "Ohm's Law Discussion",
  "created_at": "2026-08-31T10:00:00",
  "updated_at": "2026-08-31T10:00:00",
  "messages": []
}
2. List Conversations
GET /conversations/?user_id={user_id}

Query Parameters:

Parameter	Type	Required	Description
user_id	string	✅ Yes	User identifier
skip	int	❌ No	Pagination offset
limit	int	❌ No	Items per page (max 500)
Response (200 OK):

json
{
  "items": [
    {
      "id": "conv-456",
      "user_id": "user-123",
      "title": "Ohm's Law Discussion",
      "created_at": "2026-08-31T10:00:00",
      "updated_at": "2026-08-31T10:00:00",
      "messages": []
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 100
}
3. Get a Conversation
GET /conversations/{conversation_id}?user_id={user_id}

Path Parameters:

Parameter	Type	Required	Description
conversation_id	string	✅ Yes	Conversation ID
Response (200 OK):

json
{
  "id": "conv-456",
  "user_id": "user-123",
  "title": "Ohm's Law Discussion",
  "created_at": "2026-08-31T10:00:00",
  "updated_at": "2026-08-31T10:00:00",
  "messages": [
    {
      "id": "msg-789",
      "conversation_id": "conv-456",
      "role": "user",
      "content": "What is Ohm's law?",
      "extra_data": null,
      "created_at": "2026-08-31T10:01:00"
    }
  ]
}
4. Rename a Conversation
PATCH /conversations/{conversation_id}?user_id={user_id}

Request Body:

json
{
  "title": "New Title"
}
Response (200 OK):

json
{
  "id": "conv-456",
  "user_id": "user-123",
  "title": "New Title",
  "created_at": "2026-08-31T10:00:00",
  "updated_at": "2026-08-31T10:05:00",
  "messages": []
}
5. Delete a Conversation
DELETE /conversations/{conversation_id}?user_id={user_id}

Response (200 OK):

json
{
  "message": "Conversation deleted successfully"
}
6. Add a User Message
POST /conversations/{conversation_id}/messages?user_id={user_id}

Request Body:

json
{
  "content": "What is Ohm's law?",
  "extra_data": null
}
Note: Role is always set to "user" server-side. The client cannot set role.

Response (200 OK):

json
{
  "id": "msg-789",
  "conversation_id": "conv-456",
  "role": "user",
  "content": "What is Ohm's law?",
  "extra_data": null,
  "created_at": "2026-08-31T10:01:00"
}
7. Get Messages
GET /conversations/{conversation_id}/messages?user_id={user_id}

Query Parameters:

Parameter	Type	Required	Description
skip	int	❌ No	Pagination offset
limit	int	❌ No	Items per page (max 100)
Response (200 OK):

json
[
  {
    "id": "msg-789",
    "conversation_id": "conv-456",
    "role": "user",
    "content": "What is Ohm's law?",
    "extra_data": null,
    "created_at": "2026-08-31T10:01:00"
  },
  {
    "id": "msg-790",
    "conversation_id": "conv-456",
    "role": "assistant",
    "content": "Ohm's law states that the current through a conductor...",
    "extra_data": {"model": "gpt-3.5-turbo"},
    "created_at": "2026-08-31T10:01:30"
  }
]
8. Ask the AI Mentor (Non-Streaming)
POST /conversations/{conversation_id}/ask?user_id={user_id}

Request Body:

json
{
  "content": "What is Ohm's law?",
  "experiment_id": "exp-123",
  "simulation_id": "sim-456"
}
Field	Type	Required	Description
content	string	✅ Yes	User's question
experiment_id	string	❌ No	Current experiment ID
simulation_id	string	❌ No	Current simulation ID
Response (200 OK):

json
{
  "content": "Ohm's law states that the current through a conductor...",
  "model": "gpt-3.5-turbo",
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 80,
    "total_tokens": 230
  },
  "finish_reason": "stop",
  "context_used": {
    "experiment": {"id": "exp-123", "title": "Ohm's Law"},
    "simulation": {"status": "completed", "measurements": {...}}
  }
}
9. Ask the AI Mentor (Streaming)
POST /conversations/{conversation_id}/ask/stream?user_id={user_id}

Request Body:

json
{
  "content": "What is Ohm's law?",
  "experiment_id": "exp-123",
  "simulation_id": "sim-456"
}
Response: Server-Sent Events (SSE) stream

Events:

Event Type	Description	Example
start	Stream started	{"type":"start","content":"","metadata":{"model":"gpt-3.5-turbo"}}
delta	Text chunk	{"type":"delta","content":"Ohm's law"}
metadata	Model/usage info	{"type":"metadata","metadata":{"model":"gpt-3.5-turbo","usage":{...}}}
complete	Stream finished	{"type":"complete","content":"Full response..."}
error	Error occurred	{"type":"error","error":"Provider unavailable"}
Error Codes
Code	HTTP Status	Description
CONVERSATION_NOT_FOUND	404	Conversation ID does not exist
CONVERSATION_FORBIDDEN	403	User does not own the conversation
AI_PROVIDER_UNAVAILABLE	500	AI provider is down
AI_AUTHENTICATION_ERROR	500	Invalid API key
AI_RATE_LIMITED	429	Rate limit exceeded
AI_TIMEOUT	504	Request timed out
AI_INVALID_RESPONSE	500	Provider returned invalid response
AI_CONTEXT_ERROR	500	Failed to load context
AI_CONFIGURATION_ERROR	500	AI configuration error
AI_STREAM_ERROR	500	Streaming error
INTERNAL_ERROR	500	Unexpected error
Rate Limits
Limit	Value
Requests per user	100 per hour
Context size	100,000 characters
Response size	50,000 characters
Testing
Example: Create and Chat
bash
# 1. Create a conversation
curl -X POST http://localhost:8000/conversations/ \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","user_id":"user-a"}'

# 2. Ask the AI Mentor
curl -X POST http://localhost:8000/conversations/conv-456/ask?user_id=user-a \
  -H "Content-Type: application/json" \
  -d '{"content":"What is Ohm'\''s law?"}'

# 3. Stream the response
curl -X POST http://localhost:8000/conversations/conv-456/ask/stream?user_id=user-a \
  -H "Content-Type: application/json" \
  -d '{"content":"Explain KVL"}'
Version History
Version	Date	Changes
1.0.0	2026-08-31	Initial API documentation