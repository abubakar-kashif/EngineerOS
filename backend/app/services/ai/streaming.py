"""
Streaming failure handling for AI responses.

This module provides utilities for handling streaming failures,
including distinguishing between completed responses and stream errors.
"""

from typing import Optional, Dict, Any
from enum import Enum


class StreamFailureReason(str, Enum):
    """Reasons for streaming failure."""
    PROVIDER_DISCONNECT = "provider_disconnect"
    PROVIDER_TIMEOUT = "provider_timeout"
    MALFORMED_EVENT = "malformed_event"
    UNEXPECTED_TERMINATION = "unexpected_termination"
    PROVIDER_ERROR = "provider_error"


class StreamResult:
    """
    Represents the result of a streaming operation.

    Distinguishes between successful completion and failure.
    """

    def __init__(
        self,
        success: bool,
        content: str = "",
        partial_content: str = "",
        error: Optional[str] = None,
        failure_reason: Optional[StreamFailureReason] = None,
        model: Optional[str] = None,
        usage: Optional[Dict[str, int]] = None,
        finish_reason: Optional[str] = None,
    ):
        self.success = success
        self.content = content
        self.partial_content = partial_content
        self.error = error
        self.failure_reason = failure_reason
        self.model = model
        self.usage = usage
        self.finish_reason = finish_reason

    @classmethod
    def completed(cls, content: str, model: str, usage: Optional[Dict[str, int]] = None) -> "StreamResult":
        """Create a successful stream result."""
        return cls(
            success=True,
            content=content,
            model=model,
            usage=usage,
        )

    @classmethod
    def failed(
        cls,
        error: str,
        partial_content: str = "",
        failure_reason: Optional[StreamFailureReason] = None
    ) -> "StreamResult":
        """Create a failed stream result."""
        return cls(
            success=False,
            partial_content=partial_content,
            error=error,
            failure_reason=failure_reason,
        )

    def is_complete(self) -> bool:
        """Check if the stream completed successfully."""
        return self.success

    def is_partial(self) -> bool:
        """Check if there is partial content from a failed stream."""
        return not self.success and bool(self.partial_content)