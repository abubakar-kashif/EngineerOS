"""
AI Mentor Service — orchestrates AI interactions.
Uses the current main's conversation service and models.
"""
import uuid
import logging
import time
from typing import Optional, List, Generator
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.services.conversation_service import (
    create_conversation,
    get_conversation,
    list_messages,
    add_message,
)
from app.schemas.conversation import MessageCreateRequest, ConversationCreateRequest
from app.models import ConversationMessage
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
    AIProviderError,
    InvalidResponseError,
    normalize_provider_error,
    safe_error_response,
)
from app.services.ai.types import ProviderError as TypesProviderError
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
        payload = ConversationCreateRequest(title=title, experiment_id=None)
        return create_conversation(
            db=self.db,
            user_id=user_id,
            payload=payload
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
        """Get context for the conversation using ContextEngine."""
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

        # 2. Security: sanitize user input
        question = PromptInjectionGuard.sanitize_user_input(question)
        if PromptInjectionGuard.detect_injection(question):
            logger.warning(f"Potential prompt injection detected for user {user_id}")

        # 3. Verify conversation exists and ownership
        try:
            conv_detail = get_conversation(self.db, user_id, conversation_id)
        except HTTPException as e:
            if e.status_code == 404:
                raise ConversationNotFoundError()
            elif e.status_code == 403:
                raise ConversationForbiddenError()
            raise

        # 4. Get conversation history
        messages = list_messages(self.db, user_id, conversation_id)
        # limit to last 50
        messages = messages[-50:] if len(messages) > 50 else messages

        # 5. Build context
        context = self._get_context(
            conversation_id=conversation_id,
            question=question,
            user_id=user_id,
            experiment_id=experiment_id,
            simulation_id=simulation_id,
            quiz_id=quiz_id,
            report_id=report_id,
        )

        # 6. Validate context size
        context_dict = context.to_dict()
        self.protection.context_validator.validate(context_dict)

        # 7. Build prompt messages
        prompt_messages = self.prompt_builder.build_messages(context, question)

        # 8. Create AI request
        request = AIRequest(
            messages=prompt_messages,
            max_tokens=settings.AI_MAX_OUTPUT_TOKENS,
            temperature=settings.AI_TEMPERATURE,
        )

        # 9. Store user message
        user_msg_payload = MessageCreateRequest(role="user", content=question)
        add_message(self.db, user_id, conversation_id, user_msg_payload)

        # 10. Generate with retry and duplicate protection
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
                        delay = self.protection.get_retry_delay(attempt)
                        time.sleep(delay)
                        continue
                    if isinstance(e, TypesProviderError):
                        raise normalize_provider_error(e) from e
                    raise
        finally:
            self.protection.retry_controller.finish_request(request_id)

        # 11. Validate response — never accept empty/fabricated success
        if response is None or not (response.content or "").strip():
            raise InvalidResponseError("AI provider returned empty response")
        validated_content = self.protection.validate_response(response.content)

        # 12. Security: check for data leakage
        leak_check = DataLeakageGuard.check_response_for_leakage(validated_content)
        if leak_check["has_leak"]:
            logger.warning(f"Data leak detected in response for user {user_id}: {leak_check['leaks']}")

        # 13. Store assistant message (using add_message with role="assistant")
        assistant_payload = MessageCreateRequest(
            role="assistant",
            content=validated_content,
            metadata={"model": response.model}
        )
        msg = add_message(self.db, user_id, conversation_id, assistant_payload)

        # 14. Build AIResponse
        ai_response = AIResponse(
            content=validated_content,
            model=response.model,
            usage=response.usage,
            finish_reason=response.finish_reason,
            message_id=msg.id,
            conversation_id=msg.conversation_id,
        )
        return ai_response

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
        """Stream the AI response."""
        full_content = ""
        final_model = None
        final_usage = None
        final_finish_reason = None
        stream_success = False

        try:
            # 1. Rate limit
            if user_id:
                self.protection.check_rate_limit(user_id)

            # 2. Sanitize input
            question = PromptInjectionGuard.sanitize_user_input(question)
            if PromptInjectionGuard.detect_injection(question):
                logger.warning(f"Potential prompt injection detected for user {user_id}")

            # 3. Verify conversation
            try:
                conv_detail = get_conversation(self.db, user_id, conversation_id)
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

            # 4. Get history
            messages = list_messages(self.db, user_id, conversation_id)
            messages = messages[-50:] if len(messages) > 50 else messages

            # 5. Build context
            context = self._get_context(
                conversation_id=conversation_id,
                question=question,
                user_id=user_id,
                experiment_id=experiment_id,
                simulation_id=simulation_id,
                quiz_id=quiz_id,
                report_id=report_id,
            )

            # 6. Validate context
            context_dict = context.to_dict()
            self.protection.context_validator.validate(context_dict)

            # 7. Build prompt
            prompt_messages = self.prompt_builder.build_messages(context, question)

            # 8. Create request with streaming
            request = AIRequest(
                messages=prompt_messages,
                stream=True,
                max_tokens=settings.AI_MAX_OUTPUT_TOKENS,
                temperature=settings.AI_TEMPERATURE,
            )

            # 9. Store user message
            user_msg_payload = MessageCreateRequest(role="user", content=question)
            add_message(self.db, user_id, conversation_id, user_msg_payload)

            # 10. Stream with retry
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

                                # Store assistant message
                                assistant_payload = MessageCreateRequest(
                                    role="assistant",
                                    content=validated_content,
                                    metadata={
                                        "model": final_model or "unknown",
                                        "finish_reason": final_finish_reason,
                                        "usage": final_usage,
                                    }
                                )
                                msg = add_message(self.db, user_id, conversation_id, assistant_payload)

                                # Update event with message IDs
                                event.message_id = msg.id
                                event.conversation_id = msg.conversation_id

                            yield event
                        break
                    except Exception as e:
                        if self.protection.should_retry(e, attempt):
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

            if not stream_success and full_content:
                # Partial response – don't save
                pass

        except Exception as e:
            yield StreamEvent(
                type=StreamEventType.ERROR,
                error=f"Unexpected error: {str(e)}",
                error_type=StreamErrorType.UNEXPECTED_TERMINATION,
            )