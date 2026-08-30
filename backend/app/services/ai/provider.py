from abc import ABC, abstractmethod
from .types import AIRequest, AIResponse, ProviderError, AIMessage


class AIProvider(ABC):
    """Abstract interface for AI providers."""

    @abstractmethod
    def generate(self, request: AIRequest) -> AIResponse:
        """Generate a response from the AI provider."""
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        """Return the name of the provider."""
        pass