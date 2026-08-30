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
from app.services.ai.types import (
    AIRequest, AIMessage, AIResponse, StreamEvent,
    StreamEventType, StreamErrorType
)
from app.services.ai.errors import (
    TimeoutError,
    ConfigurationError,
    ConversationNotFoundError,
    ConversationForbiddenError,
)
from app.services.ai.protection import (
    protection_manager,
    get_protection_manager,
)
from app.models.conversation import Conversation


class MentorService:
    """AI Mentor service for educational conversations."""

    def __init__(self, db: Session):
        self.db = db
        self.provider = ProviderFactory.get_provider()
        self.protection = get_protection_manager()

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
        # 1. Rate limit check
        if user_id:
            self.protection.check_rate_limit(user_id)

        # 2. Verify conversation exists and ownership
        try:
            get_conversation(self.db, conversation_id, user_id)
        except HTTPException as e:
            if e.status_code == 404:
                raise ConversationNotFoundError()
            elif e.status_code == 403:
                raise ConversationForbiddenError()
            raise

        # 3. Get conversation history
        messages, _ = get_messages(
            self.db,
            conversation_id,
            user_id,
            limit=50
        )

        # 4. Save user question
        add_message(
            self.db,
            conversation_id,
            "user",
            question,
            user_id=user_id
        )

        # 5. Build AI request
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

        # 6. Create request
        request = AIRequest(messages=ai_messages)

        # 7. Generate with retry
        attempt = 0
        while True:
            attempt += 1
            try:
                response = self.provider.generate(request)
                break
            except Exception as e:
                if self.protection.should_retry(e, attempt):
                    import time
                    delay = self.protection.get_retry_delay(attempt)
                    time.sleep(delay)
                    continue
                raise

        # 8. Validate response
        validated_content = self.protection.validate_response(response.content)

        # 9. Save assistant response
        add_message(
            self.db,
            conversation_id,
            "assistant",
            validated_content,
            extra_data={"model": response.model},
            user_id=user_id
        )

        # 10. Return validated response
        response.content = validated_content
        return response

    def ask_stream(
        self,
        conversation_id: str,
        question: str,
        user_id: Optional[str] = None
    ) -> Generator[StreamEvent, None, None]:
        """
        Ask the AI mentor a question with streaming response.
        """
        full_content = ""
        final_model = None
        final_usage = None
        final_finish_reason = None
        stream_success = False

        try:
            # 1. Rate limit check
            if user_id:
                self.protection.check_rate_limit(user_id)

            # 2. Verify conversation exists and ownership
            try:
                get_conversation(self.db, conversation_id, user_id)
            except HTTPException as e:
                if e.status_code == 404:
                    yield StreamEvent(
                        type=StreamEventType.ERROR,
                        error="Conversation not found",
                        error_type=StreamErrorType.UNEXPECTED_TERMINATION,
                    )
                    return
                elif e.status_code == 403:
                    yield StreamEvent(
                        type=StreamEventType.ERROR,
                        error="Access denied to conversation",
                        error_type=StreamErrorType.UNEXPECTED_TERMINATION,
                    )
                    return
                raise

            # 3. Get conversation history
            messages, _ = get_messages(
                self.db,
                conversation_id,
                user_id,
                limit=50
            )

            # 4. Save user question
            add_message(
                self.db,
                conversation_id,
                "user",
                question,
                user_id=user_id
            )

            # 5. Build AI request
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

            # 6. Create request
            request = AIRequest(messages=ai_messages, stream=True)

            # 7. Stream with retry
            attempt = 0
            while True:
                attempt += 1
                try:
                    for event in self.provider.stream(request):
                        if event.type == StreamEventType.DELTA:
                            full_content += event.content or ""

                        if event.type == StreamEventType.METADATA and event.metadata:
                            final_model = event.metadata.get("model", final_model)
                            final_usage = event.metadata.get("usage", final_usage)
                            final_finish_reason = event.metadata.get("finish_reason", final_finish_reason)

                        if event.type == StreamEventType.COMPLETE:
                            stream_success = True
                            # Validate response
                            validated_content = self.protection.validate_response(full_content)
                            # Save the complete response
                            add_message(
                                self.db,
                                conversation_id,
                                "assistant",
                                validated_content,
                                extra_data={
                                    "model": final_model or "unknown",
                                    "finish_reason": final_finish_reason,
                                    "usage": final_usage,
                                },
                                user_id=user_id
                            )

                        yield event
                    break
                except Exception as e:
                    if self.protection.should_retry(e, attempt):
                        import time
                        delay = self.protection.get_retry_delay(attempt)
                        yield StreamEvent(
                            type=StreamEventType.ERROR,
                            error=f"Retrying: {str(e)}",
                            error_type=StreamErrorType.PROVIDER_ERROR,
                        )
                        time.sleep(delay)
                        continue
                    raise

            # If stream ended without error but also without complete event
            if not stream_success and full_content:
                # This is a partial response - don't save it
                pass

        except Exception as e:
            yield StreamEvent(
                type=StreamEventType.ERROR,
                error=f"Unexpected error: {str(e)}",
                error_type=StreamErrorType.UNEXPECTED_TERMINATION,
            )