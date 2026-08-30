from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.services.conversation_service import get_conversation, get_messages


class ConversationContext:
    """
    Loads conversation history and converts to AI-readable context.

    This adapter loads recent relevant messages from a conversation.
    It does NOT send unlimited history - only recent messages.
    It enforces ownership through the conversation service.
    """

    def __init__(self, db: Session):
        self.db = db

    def load(
        self,
        conversation_id: str,
        user_id: Optional[str] = None,
        limit: int = 20,
    ) -> Optional[Dict[str, Any]]:
        """
        Load conversation context for AI.

        Args:
            conversation_id: ID of the conversation
            user_id: User ID for ownership verification
            limit: Maximum number of recent messages to include

        Returns:
            Dict with conversation context, or None if not found

        Raises:
            HTTPException: If conversation not found or access denied
        """
        # Verify conversation exists and ownership
        try:
            conversation = get_conversation(self.db, conversation_id, user_id)
        except HTTPException:
            # Re-raise with consistent error
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Get messages with ownership check
        try:
            messages, total = get_messages(
                self.db,
                conversation_id,
                user_id,
                skip=0,
                limit=limit,
            )
        except HTTPException:
            raise HTTPException(status_code=404, detail="Messages not found")

        if not messages:
            return {
                "conversation_id": conversation_id,
                "title": conversation.title,
                "has_messages": False,
                "message_count": 0,
                "recent_messages": [],
            }

        # Build recent messages list
        recent_messages = []
        for msg in messages:
            recent_messages.append({
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat() if msg.created_at else None,
            })

        return {
            "conversation_id": conversation_id,
            "title": conversation.title,
            "has_messages": True,
            "message_count": total,
            "recent_messages": recent_messages,
            "recent_count": len(recent_messages),
        }

    def load_with_current_question(
        self,
        conversation_id: str,
        current_question: str,
        user_id: Optional[str] = None,
        limit: int = 20,
    ) -> Optional[Dict[str, Any]]:
        """
        Load conversation context with the current question included.

        This is the primary method used by the context engine.

        Args:
            conversation_id: ID of the conversation
            current_question: The user's current question
            user_id: User ID for ownership verification
            limit: Maximum number of recent messages to include

        Returns:
            Dict with conversation context including current question
        """
        context = self.load(conversation_id, user_id, limit)

        if context:
            context["current_question"] = current_question

        return context