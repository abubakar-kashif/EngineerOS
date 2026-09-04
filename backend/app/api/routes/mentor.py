"""
AI Mentor API routes — connects MentorService to HTTP endpoints.
"""
import json
from enum import Enum
from typing import Any, Optional
from dataclasses import asdict
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.ai.mentor_service import MentorService
from app.services.ai.types import AIResponse, StreamEvent
from app.services.ai.errors import (
    AIError,
    AIErrorCode,
    ConversationNotFoundError,
    ConversationForbiddenError,
    safe_error_response,
)


class AskRequest(BaseModel):
    content: str
    experiment_id: Optional[str] = None
    simulation_id: Optional[str] = None
    quiz_id: Optional[str] = None
    report_id: Optional[str] = None
    stage: Optional[str] = None


class AskStreamRequest(BaseModel):
    content: str
    experiment_id: Optional[str] = None
    simulation_id: Optional[str] = None
    quiz_id: Optional[str] = None
    report_id: Optional[str] = None
    stage: Optional[str] = None


# Must live under /api so the frontend API client (VITE_API_BASE_URL …/api) can reach it.
router = APIRouter(prefix="/api/conversations", tags=["mentor"])


def _http_status_for_ai_error(error: AIError) -> int:
    """Map normalized AI errors to controlled HTTP status codes."""
    mapping = {
        AIErrorCode.CONVERSATION_NOT_FOUND: 404,
        AIErrorCode.CONVERSATION_FORBIDDEN: 403,
        AIErrorCode.RATE_LIMITED: 429,
        AIErrorCode.TIMEOUT: 504,
        AIErrorCode.AUTHENTICATION_ERROR: 502,
        AIErrorCode.CONFIGURATION_ERROR: 503,
        AIErrorCode.PROVIDER_UNAVAILABLE: 502,
        AIErrorCode.INVALID_RESPONSE: 502,
        AIErrorCode.STREAM_ERROR: 502,
        AIErrorCode.CONTEXT_ERROR: 500,
    }
    return mapping.get(error.code, 500)


def _stream_event_payload(event: StreamEvent) -> dict[str, Any]:
    """Serialize stream events without leaking internals."""
    payload = asdict(event)
    for key, value in list(payload.items()):
        if isinstance(value, Enum):
            payload[key] = value.value
    return payload


@router.post("/{conversation_id}/ask", response_model=AIResponse)
def ask_mentor(
    conversation_id: str,
    request: AskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        mentor = MentorService(db)
        response = mentor.ask(
            conversation_id=conversation_id,
            question=request.content,
            user_id=current_user.id,
            experiment_id=request.experiment_id,
            simulation_id=request.simulation_id,
            quiz_id=request.quiz_id,
            report_id=request.report_id,
            stage=request.stage,
        )
        return response
    except ConversationNotFoundError:
        raise HTTPException(status_code=404, detail="Conversation not found")
    except ConversationForbiddenError:
        raise HTTPException(status_code=403, detail="Access denied")
    except AIError as e:
        error_response = safe_error_response(e)
        raise HTTPException(
            status_code=_http_status_for_ai_error(e),
            detail=error_response.get("message", "AI service error"),
        )
    except Exception as e:
        error_response = safe_error_response(e)
        raise HTTPException(
            status_code=500,
            detail=error_response.get("message", "AI service error"),
        )


@router.post("/{conversation_id}/ask/stream")
def ask_mentor_stream(
    conversation_id: str,
    request: AskStreamRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    def generate():
        try:
            mentor = MentorService(db)
            for event in mentor.ask_stream(
                conversation_id=conversation_id,
                question=request.content,
                user_id=current_user.id,
                experiment_id=request.experiment_id,
                simulation_id=request.simulation_id,
                quiz_id=request.quiz_id,
                report_id=request.report_id,
                stage=request.stage,
            ):
                yield f"data: {json.dumps(_stream_event_payload(event), default=str)}\n\n"
        except ConversationNotFoundError:
            yield 'data: {"type": "error", "error": "Conversation not found"}\n\n'
        except ConversationForbiddenError:
            yield 'data: {"type": "error", "error": "Access denied"}\n\n'
        except AIError as e:
            error_response = safe_error_response(e)
            message = error_response.get("message", "AI service error")
            yield f"data: {json.dumps({'type': 'error', 'error': message})}\n\n"
        except Exception as e:
            error_response = safe_error_response(e)
            message = error_response.get("message", "AI service error")
            yield f"data: {json.dumps({'type': 'error', 'error': message})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
