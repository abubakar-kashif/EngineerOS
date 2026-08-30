from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field
from enum import Enum


class StreamEventType(str, Enum):
    """Types of streaming events."""
    START = "start"
    DELTA = "delta"
    METADATA = "metadata"
    COMPLETE = "complete"
    ERROR = "error"


@dataclass
class StreamEvent:
    """A single streaming event."""
    type: StreamEventType
    content: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


@dataclass
class AIMessage:
    """A single message in a conversation."""
    role: str  # "system", "user", "assistant"
    content: str


@dataclass
class AIRequest:
    """Provider-neutral request to an AI provider."""
    messages: List[AIMessage]
    model: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    stream: bool = False
    extra_params: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AIResponse:
    """Provider-neutral response from an AI provider."""
    content: str
    model: str
    usage: Optional[Dict[str, int]] = None
    finish_reason: Optional[str] = None
    context_used: Optional[Dict[str, Any]] = None


class ProviderError(Exception):
    """Base exception for provider-related errors."""
    pass