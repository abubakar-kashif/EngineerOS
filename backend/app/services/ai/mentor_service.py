import uuid
from typing import Optional, List
from sqlalchemy.orm import Session

from app.services.conversation_service import (
    create_conversation,
    add_message,
    get_conversation,
    get_messages,
)
from app.services.ai.provider_factory import ProviderFactory
from app.services.ai.types import AIRequest, AIMessage, AIResponse
from app.models.conversation import Conversation


class MentorService:
    """AI Mentor service for educational conversations."""

    def __init__(self, db: Session):
        self.db = db
        self.provider = ProviderFactory.get_provider()

    def start_conversation(
        self,
        user_id: Optional[str] = None,
        title: str = "AI Mentor Session"
    ) -> Conversation:
        """Start a new mentor conversation."""
        return create_conversation(
            db=self.db,
            user_id=user_id,
            title=title
        )

    def ask(
        self,
        conversation_id: str,
        question: str,
        user_id: Optional[str] = None
    ) -> AIResponse:
        """
        Ask the AI mentor a question in context of a conversation.

        Args:
            conversation_id: ID of the conversation
            question: User's question
            user_id: Optional user ID for ownership verification

        Returns:
            AIResponse: Normalized AI response

        Raises:
            HTTPException: If conversation not found or access denied
        """
        # 1. Verify conversation exists and ownership
        get_conversation(self.db, conversation_id, user_id)

        # 2. Get conversation history
        messages, _ = get_messages(
            self.db,
            conversation_id,
            user_id,
            limit=50
        )

        # 3. Save user question
        add_message(
            self.db,
            conversation_id,
            "user",
            question,
            user_id=user_id
        )

        # 4. Build AI request with history
        ai_messages = []

        # System prompt
        ai_messages.append(AIMessage(
            role="system",
            content=(
                "You are an AI mentor for electrical engineering. "
                "Help students understand concepts, solve problems, "
                "and think critically. Be supportive and educational."
            )
        ))

        # Conversation history
        for msg in messages:
            ai_messages.append(AIMessage(
                role=msg.role,
                content=msg.content
            ))

        # New question
        ai_messages.append(AIMessage(
            role="user",
            content=question
        ))

        # 5. Call provider
        request = AIRequest(messages=ai_messages)
        response = self.provider.generate(request)

        # 6. Save assistant response
        add_message(
            self.db,
            conversation_id,
            "assistant",
            response.content,
            extra_data={"model": response.model},
            user_id=user_id
        )

        return response