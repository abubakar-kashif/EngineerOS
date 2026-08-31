"""
AI Mentor API routes — connects MentorService to HTTP endpoints.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.services.ai.mentor_service import MentorService
from app.services.ai.types import AIResponse
from app.services.ai.errors import (
    ConversationNotFoundError,
    ConversationForbiddenError,
    safe_error_response,
)


class AskRequest(BaseModel):
    """Request body for /ask endpoint."""
    content: str
    experiment_id: Optional[str] = None
    simulation_id: Optional[str] = None


class AskStreamRequest(BaseModel):
    """Request body for /ask/stream endpoint."""
    content: str
    experiment_id: Optional[str] = None
    simulation_id: Optional[str] = None


router = APIRouter(prefix="/conversations", tags=["mentor"])


@router.post("/{conversation_id}/ask", response_model=AIResponse)
def ask_mentor(
    conversation_id: str,
    request: AskRequest,
    user_id: str = Query(..., description="TEMP: replace with real authenticated user"),
    db: Session = Depends(get_db),
):
    """
    Ask the AI Mentor a question in the context of a conversation.

    This is the primary endpoint for getting real AI responses.
    """
    try:
        mentor = MentorService(db)
        response = mentor.ask(
            conversation_id=conversation_id,
            question=request.content,
            user_id=user_id,
            experiment_id=request.experiment_id,
            simulation_id=request.simulation_id,
        )
        return response
    except ConversationNotFoundError:
        raise HTTPException(status_code=404, detail="Conversation not found")
    except ConversationForbiddenError:
        raise HTTPException(status_code=403, detail="Access denied")
    except Exception as e:
        error_response = safe_error_response(e)
        raise HTTPException(
            status_code=500,
            detail=error_response.get("message", "AI service error")
        )


@router.post("/{conversation_id}/ask/stream")
def ask_mentor_stream(
    conversation_id: str,
    request: AskStreamRequest,
    user_id: str = Query(..., description="TEMP: replace with real authenticated user"),
    db: Session = Depends(get_db),
):
    """
    Ask the AI Mentor a question with streaming response.

    Returns a Server-Sent Events (SSE) stream with:
    - start: stream started
    - delta: text chunks
    - metadata: model/usage info
    - complete: stream finished
    - error: error occurred
    """
    def generate():
        try:
            mentor = MentorService(db)
            for event in mentor.ask_stream(
                conversation_id=conversation_id,
                question=request.content,
                user_id=user_id,
                experiment_id=request.experiment_id,
                simulation_id=request.simulation_id,
            ):
                yield f"data: {event.model_dump_json()}\n\n"
        except ConversationNotFoundError:
            yield f"data: {{\"type\": \"error\", \"error\": \"Conversation not found\"}}\n\n"
        except ConversationForbiddenError:
            yield f"data: {{\"type\": \"error\", \"error\": \"Access denied\"}}\n\n"
        except Exception as e:
            error_response = safe_error_response(e)
            yield f"data: {{\"type\": \"error\", \"error\": \"{error_response.get('message', 'AI service error')}\"}}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")