from abc import ABC, abstractmethod
from typing import Generator, Optional
from .types import AIRequest, AIResponse, ProviderError, AIMessage, StreamEvent


class AIProvider(ABC):
    """Abstract interface for AI providers."""

    @abstractmethod
    def generate(self, request: AIRequest) -> AIResponse:
        """Generate a response from the AI provider."""
        pass

    @abstractmethod
    def stream(self, request: AIRequest) -> Generator[StreamEvent, None, None]:
        """
        Stream a response from the AI provider.

        Args:
            request: Provider-neutral request

        Yields:
            StreamEvent: START, DELTA, METADATA, COMPLETE, or ERROR events

        Raises:
            ProviderError: For provider-specific failures
        """
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        """Return the name of the provider."""
        pass