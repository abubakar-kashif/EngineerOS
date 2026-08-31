from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.services.conversation_service import (
    create_conversation,
    get_conversation,
    list_conversations,
    add_user_message,
    get_messages,
    rename_conversation,
    delete_conversation,
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
    user_id: str = Query(..., description="TEMP: replace with real authenticated user"),  # ADD
    db: Session = Depends(get_db),
):
    """Create a new conversation."""
    conv = create_conversation(
        db=db,
        user_id=user_id,  # Use route-provided user_id
        title=payload.title,
    )
    return ConversationResponse.model_validate(conv)

@router.get("/", response_model=ConversationListResponse)
def list_conversations_endpoint(
    user_id: str = Query(..., description="TEMP: replace with real authenticated user"),  # REQUIRED
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
    user_id: str = Query(..., description="TEMP: replace with real authenticated user"),  # REQUIRED
    db: Session = Depends(get_db),
):
    """Get a conversation by ID."""
    conv = get_conversation(
        db=db,
        conversation_id=conversation_id,
        user_id=user_id,
    )
    return ConversationResponse.model_validate(conv)


@router.patch("/{conversation_id}", response_model=ConversationResponse)
def rename_conversation_endpoint(
    conversation_id: str,
    payload: ConversationCreate,
    user_id: str = Query(..., description="TEMP: replace with real authenticated user"),  # REQUIRED
    db: Session = Depends(get_db),
):
    """Rename a conversation."""
    conv = rename_conversation(
        db=db,
        conversation_id=conversation_id,
        new_title=payload.title,
        user_id=user_id,
    )
    return ConversationResponse.model_validate(conv)


@router.delete("/{conversation_id}")
def delete_conversation_endpoint(
    conversation_id: str,
    user_id: str = Query(..., description="TEMP: replace with real authenticated user"),  # REQUIRED
    db: Session = Depends(get_db),
):
    """Delete a conversation."""
    delete_conversation(
        db=db,
        conversation_id=conversation_id,
        user_id=user_id,
    )
    return {"message": "Conversation deleted successfully"}


@router.post("/{conversation_id}/messages", response_model=MessageResponse)
def add_message_endpoint(
    conversation_id: str,
    payload: MessageCreate,
    user_id: str = Query(..., description="TEMP: replace with real authenticated user"),  # REQUIRED
    db: Session = Depends(get_db),
):
    """Add a user message to a conversation (role is always 'user')."""
    get_conversation(db, conversation_id, user_id)
    
    msg = add_user_message(
        db=db,
        conversation_id=conversation_id,
        role="user",
        content=payload.content,
        extra_data=payload.extra_data,
        user_id=user_id,
    )
    return MessageResponse.model_validate(msg)


@router.get("/{conversation_id}/messages", response_model=list[MessageResponse])
def get_messages_endpoint(
    conversation_id: str,
    user_id: str = Query(..., description="TEMP: replace with real authenticated user"),  # REQUIRED
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