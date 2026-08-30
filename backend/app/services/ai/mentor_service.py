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
from app.services.ai.prompt_builder import PromptBuilder
from app.services.ai.context_engine import ContextEngine, ContextResult


class MentorService:
    """AI Mentor service for educational conversations."""

    def __init__(self, db: Session):
        self.db = db
        self.provider = ProviderFactory.get_provider()
        self.protection = get_protection_manager()
        self.prompt_builder = PromptBuilder()

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

    def _get_context(
        self,
        conversation_id: str,
        question: str,
        user_id: Optional[str] = None,
        experiment_id: Optional[str] = None,
        simulation_id: Optional[str] = None,
    ) -> ContextResult:
        """
        Get context for the conversation using ContextEngine.

        Args:
            conversation_id: Current conversation ID
            question: User's question
            user_id: Optional user ID for ownership
            experiment_id: Optional experiment ID
            simulation_id: Optional simulation ID

        Returns:
            ContextResult: Structured context from ContextEngine
        """
        engine = ContextEngine(self.db)
        return engine.gather_context(
            user_id=user_id,
            conversation_id=conversation_id,
            question=question,
            experiment_id=experiment_id,
            simulation_id=simulation_id,
        )

    def ask(
        self,
        conversation_id: str,
        question: str,
        user_id: Optional[str] = None,
        experiment_id: Optional[str] = None,
        simulation_id: Optional[str] = None,
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

        # 5. Build AI request using PromptBuilder with context
        context = self._get_context(
            conversation_id=conversation_id,
            question=question,
            user_id=user_id,
            experiment_id=experiment_id,
            simulation_id=simulation_id,
        )
        prompt_messages = self.prompt_builder.build_messages(context, question)
        request = AIRequest(messages=prompt_messages)

        # 6. Generate with retry
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

        # 7. Validate response
        validated_content = self.protection.validate_response(response.content)

        # 8. Save assistant response
        add_message(
            self.db,
            conversation_id,
            "assistant",
            validated_content,
            extra_data={"model": response.model},
            user_id=user_id
        )

        # 9. Return validated response
        response.content = validated_content
        return response

    def ask_stream(
        self,
        conversation_id: str,
        question: str,
        user_id: Optional[str] = None,
        experiment_id: Optional[str] = None,
        simulation_id: Optional[str] = None,
    ) -> Generator[StreamEvent, None, None]:
        """
        Ask the AI mentor a question with streaming response.

        Yields:
            StreamEvent: START, DELTA, METADATA, COMPLETE, or ERROR events
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

            # 5. Build AI request using PromptBuilder with context
            context = self._get_context(
                conversation_id=conversation_id,
                question=question,
                user_id=user_id,
                experiment_id=experiment_id,
                simulation_id=simulation_id,
            )
            prompt_messages = self.prompt_builder.build_messages(context, question)
            request = AIRequest(messages=prompt_messages, stream=True)

            # 6. Stream with retry
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