import os
from typing import Optional, Dict, Any, Generator

from app.services.ai.types import (
    AIRequest, AIResponse, ProviderError, AIMessage,
    StreamEvent, StreamEventType
)
from app.services.ai.provider import AIProvider


class OpenAIProvider(AIProvider):
    """OpenAI implementation of the AIProvider interface."""

    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-3.5-turbo"):
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
                "stream": False,
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
                context_used=None,
            )

        except Exception as e:
            raise ProviderError(f"OpenAI API error: {str(e)}")

    def stream(self, request: AIRequest) -> Generator[StreamEvent, None, None]:
        """Stream a response from OpenAI."""
        try:
            messages = [
                {"role": msg.role, "content": msg.content}
                for msg in request.messages
            ]

            params = {
                "model": request.model or self.model,
                "messages": messages,
                "stream": True,
            }

            if request.temperature is not None:
                params["temperature"] = request.temperature
            if request.max_tokens is not None:
                params["max_tokens"] = request.max_tokens

            params.update(request.extra_params)

            # Emit START event
            yield StreamEvent(
                type=StreamEventType.START,
                content="",
                metadata={"model": params["model"]}
            )

            # Stream from OpenAI
            stream = self.client.chat.completions.create(**params)
            full_content = ""
            finish_reason = None
            usage = None

            for chunk in stream:
                if chunk.choices and len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta
                    if delta.content:
                        content = delta.content
                        full_content += content
                        yield StreamEvent(
                            type=StreamEventType.DELTA,
                            content=content
                        )
                    if chunk.choices[0].finish_reason:
                        finish_reason = chunk.choices[0].finish_reason

                if chunk.usage:
                    usage = {
                        "prompt_tokens": chunk.usage.prompt_tokens,
                        "completion_tokens": chunk.usage.completion_tokens,
                        "total_tokens": chunk.usage.total_tokens,
                    }

            # Emit METADATA event
            yield StreamEvent(
                type=StreamEventType.METADATA,
                metadata={
                    "model": params["model"],
                    "finish_reason": finish_reason,
                    "usage": usage,
                }
            )

            # Emit COMPLETE event
            yield StreamEvent(
                type=StreamEventType.COMPLETE,
                content=full_content,
                metadata={
                    "model": params["model"],
                    "finish_reason": finish_reason,
                    "usage": usage,
                }
            )

        except Exception as e:
            yield StreamEvent(
                type=StreamEventType.ERROR,
                error=f"OpenAI API error: {str(e)}"
            )

    def get_provider_name(self) -> str:
        return "openai"