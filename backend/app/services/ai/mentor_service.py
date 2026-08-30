import uuid
from typing import Optional, List, Generator
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.services.conversation_service import (
    create_conversation,
    add_message,
    get_conversation,
    get_messages,
)
from app.services.ai.provider_factory import ProviderFactory
from app.services.ai.types import AIRequest, AIMessage, AIResponse, StreamEvent
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
        """Ask the AI mentor a question (non-streaming)."""
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

        # 4. Build AI request
        ai_messages = []

        ai_messages.append(AIMessage(
            role="system",
            content=(
                "You are an AI mentor for electrical engineering. "
                "Help students understand concepts, solve problems, "
                "and think critically. Be supportive and educational."
            )
        ))

        for msg in messages:
            ai_messages.append(AIMessage(
                role=msg.role,
                content=msg.content
            ))

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

    def ask_stream(
        self,
        conversation_id: str,
        question: str,
        user_id: Optional[str] = None
    ) -> Generator[StreamEvent, None, None]:
        """
        Ask the AI mentor a question with streaming response.

        Yields:
            StreamEvent: START, DELTA, METADATA, COMPLETE, or ERROR events

        Raises:
            HTTPException: If conversation not found or access denied
        """
        full_content = ""
        final_model = None
        final_usage = None
        final_finish_reason = None

        try:
            # 1. Verify conversation exists and ownership
            get_conversation(self.db, conversation_id, user_id)

            # 2. Get conversation history
            messages, _ = get_messages(
                self.db,
                conversation_id,
                user_id,
                limit=50
            )

            # 3. Save user question (immediately)
            add_message(
                self.db,
                conversation_id,
                "user",
                question,
                user_id=user_id
            )

            # 4. Build AI request
            ai_messages = []

            ai_messages.append(AIMessage(
                role="system",
                content=(
                    "You are an AI mentor for electrical engineering. "
                    "Help students understand concepts, solve problems, "
                    "and think critically. Be supportive and educational."
                )
            ))

            for msg in messages:
                ai_messages.append(AIMessage(
                    role=msg.role,
                    content=msg.content
                ))

            ai_messages.append(AIMessage(
                role="user",
                content=question
            ))

            # 5. Create request
            request = AIRequest(messages=ai_messages, stream=True)

            # 6. Stream from provider
            for event in self.provider.stream(request):
                if event.type == "delta":
                    full_content += event.content or ""

                if event.type == "metadata" and event.metadata:
                    final_model = event.metadata.get("model", final_model)
                    final_usage = event.metadata.get("usage", final_usage)
                    final_finish_reason = event.metadata.get("finish_reason", final_finish_reason)

                if event.type == "complete":
                    # Save the complete response
                    add_message(
                        self.db,
                        conversation_id,
                        "assistant",
                        full_content,
                        extra_data={
                            "model": final_model or "unknown",
                            "finish_reason": final_finish_reason,
                            "usage": final_usage,
                        },
                        user_id=user_id
                    )

                yield event

        except HTTPException as e:
            yield StreamEvent(
                type="error",
                error=f"Conversation error: {e.detail}"
            )
        except Exception as e:
            yield StreamEvent(
                type="error",
                error=f"Unexpected error: {str(e)}"
            )