import uuid
from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.conversation import Conversation, Message


def create_conversation(
    db: Session,
    user_id: Optional[str] = None,
    title: Optional[str] = None,
) -> Conversation:
    """Create a new conversation."""
    conv = Conversation(
        id=str(uuid.uuid4()),
        user_id=user_id,
        title=title or "New Conversation"
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


def get_conversation(
    db: Session,
    conversation_id: str,
    user_id: Optional[str] = None,
) -> Conversation:
    """Get a conversation with ownership check."""
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if user_id and conv.user_id and conv.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return conv


def list_conversations(
    db: Session,
    user_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[List[Conversation], int]:
    """List conversations for a user."""
    query = db.query(Conversation)
    
    if user_id:
        query = query.filter(Conversation.user_id == user_id)
    
    total = query.count()
    conversations = query.order_by(Conversation.updated_at.desc()).offset(skip).limit(limit).all()
    
    return conversations, total


def add_message(
    db: Session,
    conversation_id: str,
    role: str,
    content: str,
    extra_data: Optional[dict] = None,
    user_id: Optional[str] = None,
) -> Message:
    """Add a message to a conversation."""
    # Verify conversation exists and ownership
    conv = get_conversation(db, conversation_id, user_id)
    
    msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        role=role,
        content=content,
        extra_data=extra_data
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    
    # Update conversation updated_at timestamp
    db.refresh(conv)
    
    return msg


def get_messages(
    db: Session,
    conversation_id: str,
    user_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[List[Message], int]:
    """Get messages from a conversation."""
    # Verify conversation exists and ownership
    get_conversation(db, conversation_id, user_id)
    
    query = db.query(Message).filter(Message.conversation_id == conversation_id)
    total = query.count()
    messages = query.order_by(Message.created_at.asc()).offset(skip).limit(limit).all()
    
    return messages, total