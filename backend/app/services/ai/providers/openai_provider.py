import os
from typing import Optional, Dict, Any

from app.services.ai.types import AIRequest, AIResponse, ProviderError, AIMessage
from app.services.ai.provider import AIProvider

class OpenAIProvider(AIProvider):
    """
    OpenAI implementation of the AIProvider interface.
    """

    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-3.5-turbo"):
        """
        Initialize the OpenAI provider.

        Args:
            api_key: OpenAI API key. If None, reads from OPENAI_API_KEY env var.
            model: Default model to use.
        """
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        self.model = model
        self._client = None

    @property
    def client(self):
        """Lazy-load the OpenAI client."""
        if self._client is None:
            if not self.api_key:
                raise ProviderError(
                    "OpenAI API key not provided. Set OPENAI_API_KEY environment variable "
                    "or pass api_key to constructor."
                )
            try:
                from openai import OpenAI
                self._client = OpenAI(api_key=self.api_key)
            except ImportError:
                raise ProviderError(
                    "OpenAI package not installed. Run: pip install openai"
                )
        return self._client

    def generate(self, request: AIRequest) -> AIResponse:
        """Generate a response from OpenAI."""
        try:
            messages = [
                {"role": msg.role, "content": msg.content}
                for msg in request.messages
            ]

            params = {
                "model": request.model or self.model,
                "messages": messages,
                "stream": request.stream,
            }

            if request.temperature is not None:
                params["temperature"] = request.temperature
            if request.max_tokens is not None:
                params["max_tokens"] = request.max_tokens

            params.update(request.extra_params)

            response = self.client.chat.completions.create(**params)

            content = response.choices[0].message.content
            usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            } if response.usage else None

            return AIResponse(
                content=content,
                model=response.model,
                usage=usage,
                finish_reason=response.choices[0].finish_reason,
                context_used=None,  # Will be populated by Context Engine later
)

        except Exception as e:
            raise ProviderError(f"OpenAI API error: {str(e)}")

    def get_provider_name(self) -> str:
        return "openai"