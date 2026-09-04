"""
Tests for AI error system (Phase 21).
"""

import pytest

from app.services.ai.errors import (
    AIError,
    AIErrorCode,
    ConversationNotFoundError,
    ConversationForbiddenError,
    ProviderUnavailableError,
    AuthenticationError,
    RateLimitedError,
    TimeoutError,
    InvalidResponseError,
    ContextError,
    ConfigurationError,
    StreamError,
    safe_error_response,
)


class TestAIErrors:
    """Tests for AI error classes."""

    def test_ai_error_base(self):
        error = AIError(code=AIErrorCode.PROVIDER_UNAVAILABLE, message="Provider unavailable")
        assert error.code == AIErrorCode.PROVIDER_UNAVAILABLE
        assert error.message == "Provider unavailable"

    def test_ai_error_to_dict(self):
        error = AIError(
            code=AIErrorCode.RATE_LIMITED,
            message="Rate limited",
            details={"retry_after": 60}
        )
        d = error.to_dict()
        assert d["code"] == "AI_RATE_LIMITED"
        assert d["message"] == "Rate limited"
        assert d["details"]["retry_after"] == 60

    def test_ai_error_is_retryable(self):
        error = AIError(code=AIErrorCode.PROVIDER_UNAVAILABLE, message="")
        assert error.is_retryable() is True

    def test_ai_error_is_not_retryable(self):
        error = AIError(code=AIErrorCode.AUTHENTICATION_ERROR, message="")
        assert error.is_retryable() is False


class TestConversationErrors:
    """Tests for conversation-specific errors."""

    def test_conversation_not_found(self):
        error = ConversationNotFoundError()
        assert error.code == AIErrorCode.CONVERSATION_NOT_FOUND
        assert error.message == "Conversation not found"

    def test_conversation_forbidden(self):
        error = ConversationForbiddenError()
        assert error.code == AIErrorCode.CONVERSATION_FORBIDDEN
        assert error.message == "Access denied to conversation"


class TestProviderErrors:
    """Tests for provider-specific errors."""

    def test_provider_unavailable(self):
        error = ProviderUnavailableError()
        assert error.code == AIErrorCode.PROVIDER_UNAVAILABLE

    def test_authentication_error(self):
        error = AuthenticationError()
        assert error.code == AIErrorCode.AUTHENTICATION_ERROR

    def test_rate_limited(self):
        error = RateLimitedError()
        assert error.code == AIErrorCode.RATE_LIMITED

    def test_timeout(self):
        error = TimeoutError()
        assert error.code == AIErrorCode.TIMEOUT

    def test_invalid_response(self):
        error = InvalidResponseError()
        assert error.code == AIErrorCode.INVALID_RESPONSE

    def test_context_error(self):
        error = ContextError()
        assert error.code == AIErrorCode.CONTEXT_ERROR

    def test_configuration_error(self):
        error = ConfigurationError()
        assert error.code == AIErrorCode.CONFIGURATION_ERROR

    def test_stream_error(self):
        error = StreamError()
        assert error.code == AIErrorCode.STREAM_ERROR


class TestErrorNormalization:
    """Tests for error normalization functions."""

    def test_safe_error_response_with_ai_error(self):
        error = ProviderUnavailableError()
        response = safe_error_response(error)
        assert "code" in response
        assert "message" in response

    def test_safe_error_response_with_unknown_error(self):
        error = ValueError("Something went wrong")
        response = safe_error_response(error)
        assert response["code"] == "INTERNAL_ERROR"
        assert "unexpected" in response["message"].lower()
        # Must not leak raw traceback details
        assert "Something went wrong" not in response["message"]
        assert "traceback" not in response["message"].lower()

    def test_normalize_provider_error_auth(self):
        from app.services.ai.errors import normalize_provider_error
        from app.services.ai.types import ProviderError

        err = normalize_provider_error(ProviderError("OpenAI authentication failed: invalid key"))
        assert isinstance(err, AuthenticationError)

    def test_normalize_provider_error_empty_response(self):
        from app.services.ai.errors import normalize_provider_error
        from app.services.ai.types import ProviderError

        err = normalize_provider_error(ProviderError("OpenAI returned an empty response"))
        assert isinstance(err, InvalidResponseError)