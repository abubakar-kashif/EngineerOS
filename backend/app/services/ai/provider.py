from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field


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


class AIProvider(ABC):
    """
    Abstract interface for AI providers.

    All concrete AI provider implementations must inherit from this class
    and implement the generate method.
    """

    @abstractmethod
    def generate(self, request: AIRequest) -> AIResponse:
        """
        Generate a response from the AI provider.

        Args:
            request: Provider-neutral request containing messages and parameters

        Returns:
            AIResponse: Provider-neutral response containing generated content

        Raises:
            ProviderError: For provider-specific failures
        """
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        """Return the name of the provider (e.g., 'openai', 'anthropic')."""
        pass


class ProviderError(Exception):
    """Base exception for provider-related errors."""
    pass