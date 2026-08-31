"""
AI Mentor API routes — connects MentorService to HTTP endpoints.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
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

    Args:
        conversation_id: ID of the conversation
        request: Question content and optional context IDs
        user_id: Temporary user ID (replace with auth)
        db: Database session

    Returns:
        AIResponse: Normalized AI response from the mentor

    Raises:
        404: Conversation not found
        403: Access denied
        500: AI provider error
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