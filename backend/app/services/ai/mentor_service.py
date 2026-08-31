import uuid
import logging
from typing import Optional, List, Generator
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.services.conversation_service import (
    create_conversation,
    get_conversation,
    get_messages,
    add_user_message,
    add_assistant_message,
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
from app.services.ai.security import PromptInjectionGuard, DataLeakageGuard
from app.core.config import settings

logger = logging.getLogger(__name__)


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
        quiz_id: Optional[str] = None,
        report_id: Optional[str] = None,
    ) -> ContextResult:
        """
        Get context for the conversation using ContextEngine.
        """
        engine = ContextEngine(self.db)
        return engine.gather_context(
            user_id=user_id,
            conversation_id=conversation_id,
            question=question,
            experiment_id=experiment_id,
            simulation_id=simulation_id,
            quiz_id=quiz_id,
            report_id=report_id,
        )

    def ask(
        self,
        conversation_id: str,
        question: str,
        user_id: Optional[str] = None,
        experiment_id: Optional[str] = None,
        simulation_id: Optional[str] = None,
        quiz_id: Optional[str] = None,
        report_id: Optional[str] = None,
    ) -> AIResponse:
        """Ask the AI mentor a question (non-streaming)."""
        # 1. Rate limit check
        if user_id:
            self.protection.check_rate_limit(user_id)

        # 1.5 Security: sanitize user input (prevent injection)
        question = PromptInjectionGuard.sanitize_user_input(question)

        # 1.6 Security: detect injection attempts
        if PromptInjectionGuard.detect_injection(question):
            logger.warning(f"Potential prompt injection detected for user {user_id}")

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

        # 4. Save user question (role is always "user")
        add_user_message(
            self.db,
            conversation_id,
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
            quiz_id=quiz_id,
            report_id=report_id,
        )

        # 5.5 Validate context size
        context_dict = context.to_dict()
        self.protection.context_validator.validate(context_dict)

        prompt_messages = self.prompt_builder.build_messages(context, question)

        # 6. Create request with config values
        request = AIRequest(
            messages=prompt_messages,
            max_tokens=settings.AI_MAX_OUTPUT_TOKENS,
            temperature=settings.AI_TEMPERATURE,
        )

        # 7. Generate with retry and duplicate protection
        attempt = 0
        request_id = self.protection.retry_controller.generate_request_id(
            user_id or "unknown",
            question,
            conversation_id
        )
        if not self.protection.retry_controller.start_request(request_id):
            raise ConfigurationError("Duplicate request detected")

        try:
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
        finally:
            self.protection.retry_controller.finish_request(request_id)

        # 8. Validate response
        validated_content = self.protection.validate_response(response.content)

        # 8.5 Security: check response for data leakage
        leak_check = DataLeakageGuard.check_response_for_leakage(validated_content)
        if leak_check["has_leak"]:
            logger.warning(f"Data leak detected in response for user {user_id}: {leak_check['leaks']}")

        # 9. Save assistant response
        msg = add_assistant_message(
            self.db,
            conversation_id,
            validated_content,
            extra_data={"model": response.model},
            user_id=user_id
        )

        # 10. Return validated response with IDs
        response.content = validated_content
        response.message_id = msg.id
        response.conversation_id = msg.conversation_id
        return response

    def ask_stream(
        self,
        conversation_id: str,
        question: str,
        user_id: Optional[str] = None,
        experiment_id: Optional[str] = None,
        simulation_id: Optional[str] = None,
        quiz_id: Optional[str] = None,
        report_id: Optional[str] = None,
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

            # 1.5 Security: sanitize user input
            question = PromptInjectionGuard.sanitize_user_input(question)

            # 1.6 Security: detect injection attempts
            if PromptInjectionGuard.detect_injection(question):
                logger.warning(f"Potential prompt injection detected for user {user_id}")

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

            # 4. Save user question (role is always "user")
            add_user_message(
                self.db,
                conversation_id,
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
                quiz_id=quiz_id,
                report_id=report_id,
            )

            # 5.5 Validate context size
            context_dict = context.to_dict()
            self.protection.context_validator.validate(context_dict)

            prompt_messages = self.prompt_builder.build_messages(context, question)

            # 6. Create request with config values
            request = AIRequest(
                messages=prompt_messages,
                stream=True,
                max_tokens=settings.AI_MAX_OUTPUT_TOKENS,
                temperature=settings.AI_TEMPERATURE,
            )

            # 7. Stream with retry and duplicate protection
            attempt = 0
            request_id = self.protection.retry_controller.generate_request_id(
                user_id or "unknown",
                question,
                conversation_id
            )
            if not self.protection.retry_controller.start_request(request_id):
                yield StreamEvent(
                    type=StreamEventType.ERROR,
                    error="Duplicate request detected",
                    error_type=StreamErrorType.UNEXPECTED_TERMINATION,
                )
                return

            try:
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

                                # Security: check for data leakage
                                leak_check = DataLeakageGuard.check_response_for_leakage(validated_content)
                                if leak_check["has_leak"]:
                                    logger.warning(f"Data leak detected in stream response: {leak_check['leaks']}")

                                # Save the complete response (role is always "assistant")
                                msg = add_assistant_message(
                                    self.db,
                                    conversation_id,
                                    validated_content,
                                    extra_data={
                                        "model": final_model or "unknown",
                                        "finish_reason": final_finish_reason,
                                        "usage": final_usage,
                                    },
                                    user_id=user_id
                                )

                                # Update the COMPLETE event with message ID and conversation ID
                                event.message_id = msg.id
                                event.conversation_id = msg.conversation_id

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
            finally:
                self.protection.retry_controller.finish_request(request_id)

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