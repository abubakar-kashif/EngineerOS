from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.conversation import (
    ConversationCreateRequest,
    ConversationDetailResponse,
    ConversationSummaryResponse,
    ConversationUpdateRequest,
    MessageCreateRequest,
    MessageFeedbackRequest,
    MessageResponse,
)
from app.services import conversation_service

router = APIRouter(prefix="/api/conversations", tags=["Conversations"])


@router.get("", response_model=list[ConversationSummaryResponse])
def list_conversations(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return conversation_service.list_conversations(db, user.id)


@router.post("", response_model=ConversationDetailResponse, status_code=201)
def create_conversation(
    payload: ConversationCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return conversation_service.create_conversation(db, user.id, payload)


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
def get_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return conversation_service.get_conversation(db, user.id, conversation_id)


@router.patch("/{conversation_id}", response_model=ConversationSummaryResponse)
def rename_conversation(
    conversation_id: str,
    payload: ConversationUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return conversation_service.rename_conversation(
        db, user.id, conversation_id, payload
    )


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation_service.delete_conversation(db, user.id, conversation_id)


@router.get("/{conversation_id}/messages", response_model=list[MessageResponse])
def list_messages(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return conversation_service.list_messages(db, user.id, conversation_id)


@router.post(
    "/{conversation_id}/messages",
    response_model=MessageResponse,
    status_code=201,
)
def add_message(
    conversation_id: str,
    payload: MessageCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return conversation_service.add_message(db, user.id, conversation_id, payload)


@router.patch(
    "/{conversation_id}/messages/{message_id}",
    response_model=MessageResponse,
)
def update_message(
    conversation_id: str,
    message_id: str,
    payload: MessageFeedbackRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return conversation_service.set_message_feedback(
        db, user.id, conversation_id, message_id, payload.feedback
    )
