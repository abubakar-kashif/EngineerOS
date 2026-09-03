"""
AI Mentor API routes — connects MentorService to HTTP endpoints.
"""
import json
from typing import Optional
from dataclasses import asdict
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.ai.mentor_service import MentorService
from app.services.ai.types import AIResponse
from app.services.ai.errors import (
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

class AskStreamRequest(BaseModel):
    content: str
    experiment_id: Optional[str] = None
    simulation_id: Optional[str] = None
    quiz_id: Optional[str] = None
    report_id: Optional[str] = None

router = APIRouter(prefix="/conversations", tags=["mentor"])

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
            ):
                yield f"data: {json.dumps(asdict(event), default=str)}\n\n"
        except ConversationNotFoundError:
            yield f"data: {{\"type\": \"error\", \"error\": \"Conversation not found\"}}\n\n"
        except ConversationForbiddenError:
            yield f"data: {{\"type\": \"error\", \"error\": \"Access denied\"}}\n\n"
        except Exception as e:
            error_response = safe_error_response(e)
            yield f"data: {{\"type\": \"error\", \"error\": \"{error_response.get('message', 'AI service error')}\"}}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")