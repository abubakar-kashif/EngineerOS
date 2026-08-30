from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.services.conversation_service import (
    create_conversation,
    get_conversation,
    list_conversations,
    add_message,
    get_messages,
)
from app.schemas.conversation import (
    ConversationCreate,
    ConversationResponse,
    ConversationListResponse,
    MessageCreate,
    MessageResponse,
)

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.post("/", response_model=ConversationResponse)
def create_conversation_endpoint(
    payload: ConversationCreate,
    db: Session = Depends(get_db),
):
    """Create a new conversation."""
    conv = create_conversation(
        db=db,
        user_id=payload.user_id,
        title=payload.title,
    )
    return ConversationResponse.model_validate(conv)


@router.get("/", response_model=ConversationListResponse)
def list_conversations_endpoint(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """List conversations for a user."""
    conversations, total = list_conversations(
        db=db,
        user_id=user_id,
        skip=skip,
        limit=limit,
    )
    return ConversationListResponse(
        items=[ConversationResponse.model_validate(c) for c in conversations],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/{conversation_id}", response_model=ConversationResponse)
def get_conversation_endpoint(
    conversation_id: str,
    user_id: Optional[str] = Query(None, description="User ID for ownership check"),
    db: Session = Depends(get_db),
):
    """Get a conversation by ID."""
    conv = get_conversation(
        db=db,
        conversation_id=conversation_id,
        user_id=user_id,
    )
    return ConversationResponse.model_validate(conv)


@router.post("/{conversation_id}/messages", response_model=MessageResponse)
def add_message_endpoint(
    conversation_id: str,
    payload: MessageCreate,
    user_id: Optional[str] = Query(None, description="User ID for ownership check"),
    db: Session = Depends(get_db),
):
    """Add a message to a conversation."""
    msg = add_message(
        db=db,
        conversation_id=conversation_id,
        role=payload.role,
        content=payload.content,
        extra_data=payload.extra_data,
        user_id=user_id,
    )
    return MessageResponse.model_validate(msg)


@router.get("/{conversation_id}/messages", response_model=list[MessageResponse])
def get_messages_endpoint(
    conversation_id: str,
    user_id: Optional[str] = Query(None, description="User ID for ownership check"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Get messages from a conversation."""
    messages, _ = get_messages(
        db=db,
        conversation_id=conversation_id,
        user_id=user_id,
        skip=skip,
        limit=limit,
    )
    return [MessageResponse.model_validate(m) for m in messages]