"""
Normalized AI and conversation errors for EngineerOS.

This module defines standardized error types that are used throughout
the AI system. Provider-specific exceptions are translated into these
normalized errors before reaching the API layer.
"""

from enum import Enum
from typing import Optional, Dict, Any


class AIErrorCode(str, Enum):
    """Standardized error codes for AI system."""
    
    # Provider errors
    PROVIDER_UNAVAILABLE = "AI_PROVIDER_UNAVAILABLE"
    AUTHENTICATION_ERROR = "AI_AUTHENTICATION_ERROR"
    RATE_LIMITED = "AI_RATE_LIMITED"
    TIMEOUT = "AI_TIMEOUT"
    INVALID_RESPONSE = "AI_INVALID_RESPONSE"
    
    # Context errors
    CONTEXT_ERROR = "AI_CONTEXT_ERROR"
    
    # Configuration errors
    CONFIGURATION_ERROR = "AI_CONFIGURATION_ERROR"
    
    # Streaming errors
    STREAM_ERROR = "AI_STREAM_ERROR"
    
    # Conversation errors
    CONVERSATION_NOT_FOUND = "CONVERSATION_NOT_FOUND"
    CONVERSATION_FORBIDDEN = "CONVERSATION_FORBIDDEN"


class ConversationErrorCode(str, Enum):
    """Conversation-specific error codes."""
    NOT_FOUND = "CONVERSATION_NOT_FOUND"
    FORBIDDEN = "CONVERSATION_FORBIDDEN"


class AIError(Exception):
    """Base exception for all AI-related errors."""
    
    def __init__(
        self,
        code: AIErrorCode,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        original_error: Optional[Exception] = None,
    ):
        self.code = code
        self.message = message
        self.details = details or {}
        self.original_error = original_error
        super().__init__(message)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert error to a safe dictionary for API responses."""
        return {
            "code": self.code.value,
            "message": self.message,
            "details": self.details,
        }
    
    def is_retryable(self) -> bool:
        """Check if the error is retryable."""
        retryable_codes = {
            AIErrorCode.PROVIDER_UNAVAILABLE,
            AIErrorCode.RATE_LIMITED,
            AIErrorCode.TIMEOUT,
        }
        return self.code in retryable_codes


class ProviderUnavailableError(AIError):
    """Provider service is unavailable."""
    
    def __init__(self, message: str = "AI provider is currently unavailable", **kwargs):
        super().__init__(
            code=AIErrorCode.PROVIDER_UNAVAILABLE,
            message=message,
            **kwargs
        )


class AuthenticationError(AIError):
    """Authentication with provider failed."""
    
    def __init__(self, message: str = "AI provider authentication failed", **kwargs):
        super().__init__(
            code=AIErrorCode.AUTHENTICATION_ERROR,
            message=message,
            **kwargs
        )


class RateLimitedError(AIError):
    """Rate limit exceeded."""
    
    def __init__(self, message: str = "AI rate limit exceeded", **kwargs):
        super().__init__(
            code=AIErrorCode.RATE_LIMITED,
            message=message,
            **kwargs
        )


class TimeoutError(AIError):
    """Request timed out."""
    
    def __init__(self, message: str = "AI request timed out", **kwargs):
        super().__init__(
            code=AIErrorCode.TIMEOUT,
            message=message,
            **kwargs
        )


class InvalidResponseError(AIError):
    """Provider returned invalid response."""
    
    def __init__(self, message: str = "AI provider returned invalid response", **kwargs):
        super().__init__(
            code=AIErrorCode.INVALID_RESPONSE,
            message=message,
            **kwargs
        )


class ContextError(AIError):
    """Error loading or processing context."""
    
    def __init__(self, message: str = "Failed to load AI context", **kwargs):
        super().__init__(
            code=AIErrorCode.CONTEXT_ERROR,
            message=message,
            **kwargs
        )


class ConfigurationError(AIError):
    """AI configuration error."""
    
    def __init__(self, message: str = "AI provider configuration error", **kwargs):
        super().__init__(
            code=AIErrorCode.CONFIGURATION_ERROR,
            message=message,
            **kwargs
        )


class StreamError(AIError):
    """Streaming error."""
    
    def __init__(self, message: str = "AI streaming error", **kwargs):
        super().__init__(
            code=AIErrorCode.STREAM_ERROR,
            message=message,
            **kwargs
        )


class ConversationNotFoundError(AIError):
    """Conversation not found."""
    
    def __init__(self, message: str = "Conversation not found", **kwargs):
        super().__init__(
            code=AIErrorCode.CONVERSATION_NOT_FOUND,
            message=message,
            **kwargs
        )


class ConversationForbiddenError(AIError):
    """Access denied to conversation."""
    
    def __init__(self, message: str = "Access denied to conversation", **kwargs):
        super().__init__(
            code=AIErrorCode.CONVERSATION_FORBIDDEN,
            message=message,
            **kwargs
        )


def normalize_provider_error(error: Exception) -> AIError:
    """
    Normalize provider-specific exceptions into AIError.

    Args:
        error: The original exception

    Returns:
        AIError: Normalized error
    """
    error_str = str(error).lower()
    
    # Check for specific error patterns
    if "api key" in error_str or "authentication" in error_str:
        return AuthenticationError(original_error=error)
    
    if "rate limit" in error_str or "too many" in error_str:
        return RateLimitedError(original_error=error)
    
    if "timeout" in error_str or "timed out" in error_str:
        return TimeoutError(original_error=error)
    
    if "unavailable" in error_str or "connection" in error_str:
        return ProviderUnavailableError(original_error=error)
    
    if "invalid" in error_str and "response" in error_str:
        return InvalidResponseError(original_error=error)
    
    # Default to generic provider error
    return ProviderUnavailableError(
        message=f"Provider error: {str(error)}",
        original_error=error
    )


def normalize_stream_error(error: Exception) -> AIError:
    """
    Normalize streaming exceptions into AIError.

    Args:
        error: The original exception

    Returns:
        AIError: Normalized error
    """
    error_str = str(error).lower()
    
    if "timeout" in error_str:
        return TimeoutError(
            message=f"Stream timeout: {str(error)}",
            original_error=error
        )
    
    if "disconnect" in error_str or "connection" in error_str:
        return StreamError(
            message=f"Stream disconnected: {str(error)}",
            original_error=error
        )
    
    return StreamError(
        message=f"Stream error: {str(error)}",
        original_error=error
    )


def safe_error_response(error: Exception) -> Dict[str, Any]:
    """
    Create a safe API response from any error.

    Never exposes internal stack traces or sensitive information.

    Args:
        error: The original exception

    Returns:
        Dict: Safe error response
    """
    if isinstance(error, AIError):
        return error.to_dict()
    
    # Unknown error - safe fallback
    return {
        "code": "INTERNAL_ERROR",
        "message": "An unexpected error occurred",
        "details": {},
    }