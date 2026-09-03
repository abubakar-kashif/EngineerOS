"""
Tests for streaming (Phases 19-20).
"""

import pytest
from unittest.mock import Mock, patch

from app.services.ai.types import (
    StreamEvent,
    StreamEventType,
    StreamErrorType,
)
from app.services.ai.streaming import StreamResult, StreamFailureReason


class TestStreamEvent:
    """Tests for StreamEvent dataclass."""

    def test_stream_event_start(self):
        event = StreamEvent(
            type=StreamEventType.START,
            metadata={"model": "gpt-3.5-turbo"}
        )
        assert event.type == StreamEventType.START
        assert event.metadata["model"] == "gpt-3.5-turbo"

    def test_stream_event_delta(self):
        event = StreamEvent(
            type=StreamEventType.DELTA,
            content="Hello"
        )
        assert event.type == StreamEventType.DELTA
        assert event.content == "Hello"

    def test_stream_event_complete(self):
        event = StreamEvent(
            type=StreamEventType.COMPLETE,
            content="Hello world",
            metadata={"usage": {"total_tokens": 10}}
        )
        assert event.type == StreamEventType.COMPLETE
        assert event.content == "Hello world"

    def test_stream_event_error(self):
        event = StreamEvent(
            type=StreamEventType.ERROR,
            error="Connection failed",
            error_type=StreamErrorType.PROVIDER_DISCONNECT
        )
        assert event.type == StreamEventType.ERROR
        assert event.error == "Connection failed"
        assert event.error_type == StreamErrorType.PROVIDER_DISCONNECT


class TestStreamEventType:
    """Tests for StreamEventType enum."""

    def test_stream_event_type_values(self):
        assert StreamEventType.START == "start"
        assert StreamEventType.DELTA == "delta"
        assert StreamEventType.METADATA == "metadata"
        assert StreamEventType.COMPLETE == "complete"
        assert StreamEventType.ERROR == "error"


class TestStreamErrorType:
    """Tests for StreamErrorType enum."""

    def test_stream_error_type_values(self):
        assert StreamErrorType.PROVIDER_DISCONNECT == "provider_disconnect"
        assert StreamErrorType.PROVIDER_TIMEOUT == "provider_timeout"
        assert StreamErrorType.MALFORMED_EVENT == "malformed_event"
        assert StreamErrorType.UNEXPECTED_TERMINATION == "unexpected_termination"
        assert StreamErrorType.PROVIDER_ERROR == "provider_error"


class TestStreamResult:
    """Tests for StreamResult class."""

    def test_stream_result_completed(self):
        result = StreamResult.completed(
            content="Hello world",
            model="gpt-3.5-turbo",
            usage={"total_tokens": 10}
        )
        assert result.success is True
        assert result.content == "Hello world"
        assert result.is_complete() is True

    def test_stream_result_failed(self):
        result = StreamResult.failed(
            error="Connection timeout",
            partial_content="Hello",
            failure_reason=StreamFailureReason.PROVIDER_TIMEOUT
        )
        assert result.success is False
        assert result.error == "Connection timeout"
        assert result.partial_content == "Hello"
        assert result.is_complete() is False
        assert result.is_partial() is True

    def test_stream_result_failed_no_partial(self):
        result = StreamResult.failed(
            error="Provider unavailable",
        )
        assert result.success is False
        assert result.partial_content == ""
        assert result.is_partial() is False