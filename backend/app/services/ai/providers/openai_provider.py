import os
import time
from typing import Optional, Generator

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
        base_url: Optional[str] = None,
        timeout: int = 60,
    ):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY") or os.environ.get("AI_API_KEY")
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
                    "OpenAI API key not provided. Set AI_API_KEY (or OPENAI_API_KEY) "
                    "environment variable or pass api_key to constructor."
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

    def _classify_exception(self, error: Exception) -> ProviderError:
        """Map provider/network failures to controlled ProviderError messages."""
        if isinstance(error, ProviderError):
            return error

        error_msg = str(error)
        lower = error_msg.lower()
        status_code = getattr(error, "status_code", None)
        error_type = type(error).__name__.lower()

        if (
            status_code == 401
            or "authentication" in lower
            or "invalid api key" in lower
            or "incorrect api key" in lower
            or "auth" in error_type
        ):
            return ProviderError(
                "OpenAI authentication failed: invalid or missing API key"
            )

        if status_code == 429 or "rate limit" in lower or "too many" in lower:
            return ProviderError(f"OpenAI rate limit exceeded: {error_msg}")

        if (
            "timeout" in lower
            or "timed out" in lower
            or "timeout" in error_type
        ):
            return ProviderError(f"OpenAI request timed out: {error_msg}")

        if (
            "connection" in lower
            or "network" in lower
            or "connect" in error_type
        ):
            return ProviderError(f"OpenAI network failure: {error_msg}")

        return ProviderError(f"OpenAI API error: {error_msg}")

    def _validate_completion_response(self, response) -> AIResponse:
        """Reject empty or malformed provider responses — never invent content."""
        if response is None:
            raise ProviderError("OpenAI returned an empty response object")

        choices = getattr(response, "choices", None)
        if not choices:
            raise ProviderError("OpenAI returned a malformed response: no choices")

        message = getattr(choices[0], "message", None)
        content = getattr(message, "content", None) if message is not None else None

        if content is None or not str(content).strip():
            raise ProviderError("OpenAI returned an empty response")

        usage = None
        if getattr(response, "usage", None):
            usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            }

        return AIResponse(
            content=str(content),
            model=getattr(response, "model", self.model) or self.model,
            usage=usage,
            finish_reason=getattr(choices[0], "finish_reason", None),
            context_used=None,
        )

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
            return self._validate_completion_response(response)

        except ProviderError:
            raise
        except Exception as e:
            raise self._classify_exception(e)

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

            yield StreamEvent(
                type=StreamEventType.START,
                content="",
                metadata={"model": params["model"]}
            )

            full_content = ""
            finish_reason = None
            usage = None
            start_time = time.time()

            stream = self.client.chat.completions.create(**params)

            for chunk in stream:
                if time.time() - start_time > self.timeout:
                    yield StreamEvent(
                        type=StreamEventType.ERROR,
                        error="Stream timeout exceeded",
                        error_type=StreamErrorType.PROVIDER_TIMEOUT,
                    )
                    return

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

                if getattr(chunk, "usage", None):
                    usage = {
                        "prompt_tokens": chunk.usage.prompt_tokens,
                        "completion_tokens": chunk.usage.completion_tokens,
                        "total_tokens": chunk.usage.total_tokens,
                    }

            if not full_content.strip():
                yield StreamEvent(
                    type=StreamEventType.ERROR,
                    error="Stream ended with no content",
                    error_type=StreamErrorType.UNEXPECTED_TERMINATION,
                )
                return

            yield StreamEvent(
                type=StreamEventType.METADATA,
                metadata={
                    "model": params["model"],
                    "finish_reason": finish_reason,
                    "usage": usage,
                }
            )

            yield StreamEvent(
                type=StreamEventType.COMPLETE,
                content=full_content,
                metadata={
                    "model": params["model"],
                    "finish_reason": finish_reason,
                    "usage": usage,
                }
            )

        except ProviderError as e:
            lower = str(e).lower()
            if "api key" in lower or "authentication" in lower:
                error_type = StreamErrorType.PROVIDER_ERROR
            elif "timeout" in lower:
                error_type = StreamErrorType.PROVIDER_TIMEOUT
            else:
                error_type = StreamErrorType.PROVIDER_ERROR
            yield StreamEvent(
                type=StreamEventType.ERROR,
                error=str(e),
                error_type=error_type,
            )
        except Exception as e:
            classified = self._classify_exception(e)
            error_msg = str(classified)
            lower = error_msg.lower()
            if "timeout" in lower or "timed out" in lower:
                error_type = StreamErrorType.PROVIDER_TIMEOUT
            elif "disconnect" in lower or "connection" in lower or "network" in lower:
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
