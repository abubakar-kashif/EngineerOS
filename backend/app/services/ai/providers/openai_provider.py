import os
import time
from typing import Optional, Dict, Any, Generator

from app.services.ai.types import (
    AIRequest, AIResponse, ProviderError, AIMessage,
    StreamEvent, StreamEventType, StreamErrorType
)
from app.services.ai.provider import AIProvider


class OpenAIProvider(AIProvider):
    """OpenAI implementation of the AIProvider interface."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "gpt-3.5-turbo",
        base_url: Optional[str] = None,  # ADD
        timeout: int = 60,               # ADD
    ):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        self.model = model
        self.base_url = base_url
        self.timeout = timeout
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
                client_kwargs = {
                    "api_key": self.api_key,
                    "timeout": self.timeout,
                }
                if self.base_url:
                    client_kwargs["base_url"] = self.base_url
                self._client = OpenAI(**client_kwargs)
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
        """Stream a response from OpenAI with failure handling."""
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

            # Stream from OpenAI with timeout protection
            full_content = ""
            finish_reason = None
            usage = None
            start_time = time.time()
            last_chunk_time = start_time

            stream = self.client.chat.completions.create(**params)

            for chunk in stream:
                # Check for timeout
                if time.time() - start_time > self.timeout:
                    yield StreamEvent(
                        type=StreamEventType.ERROR,
                        error="Stream timeout exceeded",
                        error_type=StreamErrorType.PROVIDER_TIMEOUT,
                    )
                    return

                # Process chunk
                if chunk.choices and len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta
                    if delta.content:
                        content = delta.content
                        full_content += content
                        last_chunk_time = time.time()
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

            # Check if we got any content
            if not full_content:
                yield StreamEvent(
                    type=StreamEventType.ERROR,
                    error="Stream ended with no content",
                    error_type=StreamErrorType.UNEXPECTED_TERMINATION,
                )
                return

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
            error_msg = str(e)
            # Categorize the error
            if "timeout" in error_msg.lower() or "timed out" in error_msg.lower():
                error_type = StreamErrorType.PROVIDER_TIMEOUT
            elif "disconnect" in error_msg.lower() or "connection" in error_msg.lower():
                error_type = StreamErrorType.PROVIDER_DISCONNECT
            else:
                error_type = StreamErrorType.PROVIDER_ERROR

            yield StreamEvent(
                type=StreamEventType.ERROR,
                error=error_msg,
                error_type=error_type,
            )

    def get_provider_name(self) -> str:
        return "openai"