"""
Conversation Context — provides conversation history to AI.
Uses the current main's conversation service.
"""

from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.services.conversation_service import list_messages, get_conversation
from app.schemas.conversation import MessageResponse


class ConversationContext:
    """
    Loads conversation history and makes it available for AI context.
    """

    def __init__(self, db: Session):
        self.db = db

    def load(
        self,
        conversation_id: str,
        user_id: str,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Load recent conversation messages.
        Returns a list of dicts with 'role' and 'content'.
        """
        messages = list_messages(self.db, user_id, conversation_id)
        # Return only the last `limit` messages
        recent = messages[-limit:] if limit else messages
        return [
            {
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat() if msg.created_at else None,
            }
            for msg in recent
        ]

    def get_conversation_info(
        self,
        conversation_id: str,
        user_id: str,
    ) -> Optional[Dict[str, Any]]:
        """Get basic conversation info (title, experiment_id, etc.)."""
        conv = get_conversation(self.db, user_id, conversation_id)
        if not conv:
            return None
        return {
            "id": conv.id,
            "title": conv.title,
            "experiment_id": conv.experiment_id,
            "created_at": conv.created_at.isoformat() if conv.created_at else None,
            "updated_at": conv.updated_at.isoformat() if conv.updated_at else None,
        }