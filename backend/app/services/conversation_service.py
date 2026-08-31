import uuid
from typing import Optional, List, Tuple
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


def verify_ownership(
    db: Session,
    conversation_id: str,
    user_id: str,
) -> Conversation:
    """
    Verify that a user owns a conversation.
    
    This is the single source of truth for ownership validation.
    All other functions should call this instead of duplicating logic.
    
    Args:
        db: Database session
        conversation_id: ID of the conversation
        user_id: ID of the user (REQUIRED)
        
    Returns:
        Conversation: The conversation if ownership is verified
        
    Raises:
        HTTPException: 404 if conversation not found, 403 if access denied
    """
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Ownership check - ALWAYS enforced
    if conv.user_id is not None and conv.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return conv


def get_conversation(
    db: Session,
    conversation_id: str,
    user_id: str,
) -> Conversation:
    """Get a conversation with ownership check."""
    return verify_ownership(db, conversation_id, user_id)


def list_conversations(
    db: Session,
    user_id: str,
    skip: int = 0,
    limit: int = 100,
) -> Tuple[List[Conversation], int]:
    """List conversations for a user."""
    query = db.query(Conversation).filter(Conversation.user_id == user_id)
    total = query.count()
    conversations = query.order_by(Conversation.updated_at.desc()).offset(skip).limit(limit).all()
    return conversations, total


def rename_conversation(
    db: Session,
    conversation_id: str,
    new_title: str,
    user_id: str,
) -> Conversation:
    """Rename a conversation."""
    conv = verify_ownership(db, conversation_id, user_id)
    conv.title = new_title
    db.commit()
    db.refresh(conv)
    return conv


def delete_conversation(
    db: Session,
    conversation_id: str,
    user_id: str,
) -> bool:
    """Delete a conversation."""
    conv = verify_ownership(db, conversation_id, user_id)
    db.delete(conv)
    db.commit()
    return True


def get_messages(
    db: Session,
    conversation_id: str,
    user_id: str,
    skip: int = 0,
    limit: int = 100,
) -> Tuple[List[Message], int]:
    """Get messages from a conversation."""
    # Verify ownership first
    verify_ownership(db, conversation_id, user_id)
    
    query = db.query(Message).filter(Message.conversation_id == conversation_id)
    total = query.count()
    messages = query.order_by(Message.created_at.asc()).offset(skip).limit(limit).all()
    
    return messages, total


def add_user_message(
    db: Session,
    conversation_id: str,
    content: str,
    extra_data: Optional[dict] = None,
    user_id: str = None,
) -> Message:
    """Add a user message (role always 'user')."""
    # Verify ownership first
    verify_ownership(db, conversation_id, user_id)
    
    msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        role="user",
        content=content,
        extra_data=extra_data,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def add_assistant_message(
    db: Session,
    conversation_id: str,
    content: str,
    extra_data: Optional[dict] = None,
    user_id: str = None,
) -> Message:
    """Add an assistant message (role always 'assistant')."""
    # Verify ownership first
    verify_ownership(db, conversation_id, user_id)
    
    msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        role="assistant",
        content=content,
        extra_data=extra_data,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg