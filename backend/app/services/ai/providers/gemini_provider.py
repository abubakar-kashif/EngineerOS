import os
import re
import time
from typing import Any, Generator, List, Optional, Tuple

from app.services.ai.types import (
    AIRequest,
    AIResponse,
    ProviderError,
    StreamEvent,
    StreamEventType,
)
from app.services.ai.provider import AIProvider

# Free-tier eligible Flash model (verify against the live Models API at runtime).
DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"


def _redact_secrets(message: str, api_key: Optional[str] = None) -> str:
    """Strip key material from error text before it leaves the provider."""
    text = message or ""
    if api_key:
        text = text.replace(api_key, "[redacted]")
    text = re.sub(r"AIza[0-9A-Za-z\-_]{8,}", "[redacted]", text)
    text = re.sub(r"sk-[A-Za-z0-9]{8,}", "[redacted]", text)
    return text


class GeminiProvider(AIProvider):
    """Google Gemini implementation of the AIProvider interface."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = DEFAULT_GEMINI_MODEL,
        base_url: Optional[str] = None,
        timeout: int = 60,
    ):
        self.api_key = (
            api_key
            or os.environ.get("AI_API_KEY")
            or os.environ.get("GEMINI_API_KEY")
        )
        self.model = model or DEFAULT_GEMINI_MODEL
        self.base_url = base_url
        self.timeout = timeout
        self._client = None

    @property
    def client(self):
        """Lazy-load the Gemini client. Never log or return the API key."""
        if self._client is None:
            if not self.api_key:
                raise ProviderError(
                    "Gemini API key not provided. Set AI_API_KEY (or GEMINI_API_KEY) "
                    "environment variable or pass api_key to constructor."
                )
            try:
                from google import genai
                from google.genai import types
            except ImportError as exc:
                raise ProviderError(
                    "Gemini package not installed. Run: pip install google-genai"
                ) from exc

            client_kwargs: dict[str, Any] = {"api_key": self.api_key}
            http_options: dict[str, Any] = {"timeout": int(self.timeout * 1000)}
            if self.base_url:
                http_options["base_url"] = self.base_url
            try:
                client_kwargs["http_options"] = types.HttpOptions(**http_options)
            except Exception:
                client_kwargs["http_options"] = http_options
            self._client = genai.Client(**client_kwargs)
        return self._client

    def ensure_configured(self) -> None:
        """Fail fast when the provider cannot run (missing key / SDK)."""
        _ = self.client

    def _classify_exception(self, error: Exception) -> ProviderError:
        if isinstance(error, ProviderError):
            return error

        error_msg = _redact_secrets(str(error), self.api_key)
        lower = error_msg.lower()
        status_code = getattr(error, "status_code", None) or getattr(error, "code", None)
        error_type = type(error).__name__.lower()

        if (
            status_code in (401, 403)
            or "authentication" in lower
            or "invalid api key" in lower
            or "api key not valid" in lower
            or "api_key_invalid" in lower
            or "permission_denied" in lower
            or "auth" in error_type
        ):
            return ProviderError(
                "Gemini authentication failed: invalid or missing API key"
            )

        if status_code == 429 or "rate limit" in lower or "resource exhausted" in lower:
            return ProviderError(f"Gemini rate limit exceeded: {error_msg}")

        if "timeout" in lower or "timed out" in lower or "timeout" in error_type:
            return ProviderError(f"Gemini request timed out: {error_msg}")

        if (
            "connection" in lower
            or "network" in lower
            or "connect" in error_type
        ):
            return ProviderError(f"Gemini network failure: {error_msg}")

        return ProviderError(f"Gemini API error: {error_msg}")

    def _split_messages(
        self, request: AIRequest
    ) -> Tuple[Optional[str], List[Tuple[str, str]]]:
        system_parts: List[str] = []
        turns: List[Tuple[str, str]] = []
        for msg in request.messages:
            role = (msg.role or "user").lower()
            content = msg.content or ""
            if role == "system":
                system_parts.append(content)
            elif role == "assistant":
                turns.append(("model", content))
            else:
                turns.append(("user", content))
        if turns and turns[0][0] == "model":
            turns.insert(0, ("user", "Continue."))
        # PromptBuilder currently emits a single system message containing the
        # full grounded prompt (including the user question). Gemini requires
        # at least one user turn, so lift that payload into a user message.
        if not turns and system_parts:
            combined = "\n\n".join(p for p in system_parts if p).strip()
            return (
                "Follow the system instructions and grounded context exactly. "
                "Do not invent measurements.",
                [("user", combined)],
            )
        return ("\n\n".join(p for p in system_parts if p).strip() or None, turns)

    def _generation_config(self, request: AIRequest, system_instruction: Optional[str]):
        from google.genai import types

        kwargs: dict[str, Any] = {}
        if system_instruction:
            kwargs["system_instruction"] = system_instruction
        if request.temperature is not None:
            kwargs["temperature"] = request.temperature
        if request.max_tokens is not None:
            kwargs["max_output_tokens"] = request.max_tokens

        extra = request.extra_params or {}
        for key in ("top_p", "top_k", "stop_sequences"):
            if key in extra:
                kwargs[key] = extra[key]
        if not kwargs:
            return None
        return types.GenerateContentConfig(**kwargs)

    def _contents(self, turns: List[Tuple[str, str]]):
        from google.genai import types

        return [
            types.Content(role=role, parts=[types.Part(text=text)])
            for role, text in turns
        ]

    def _extract_text(self, response) -> Optional[str]:
        if response is None:
            return None
        try:
            text = getattr(response, "text", None)
        except Exception:
            text = None
        if text is not None:
            return str(text)
        candidates = getattr(response, "candidates", None) or []
        for candidate in candidates:
            content = getattr(candidate, "content", None)
            parts = getattr(content, "parts", None) if content is not None else None
            if not parts:
                continue
            bits = []
            for part in parts:
                part_text = getattr(part, "text", None)
                if part_text:
                    bits.append(str(part_text))
            if bits:
                return "".join(bits)
        return None

    def _usage(self, response) -> Optional[dict]:
        usage = getattr(response, "usage_metadata", None)
        if not usage:
            return None
        prompt = getattr(usage, "prompt_token_count", None)
        completion = getattr(usage, "candidates_token_count", None)
        total = getattr(usage, "total_token_count", None)
        if prompt is None and completion is None and total is None:
            return None
        return {
            "prompt_tokens": int(prompt or 0),
            "completion_tokens": int(completion or 0),
            "total_tokens": int(total or 0),
        }

    def _finish_reason(self, response) -> Optional[str]:
        candidates = getattr(response, "candidates", None) or []
        if not candidates:
            return None
        reason = getattr(candidates[0], "finish_reason", None)
        return str(reason) if reason is not None else None

    def _validate_response(self, response, model: str) -> AIResponse:
        if response is None:
            raise ProviderError("Gemini returned an empty response object")

        text = self._extract_text(response)
        if text is None or not str(text).strip():
            candidates = getattr(response, "candidates", None)
            if not candidates:
                raise ProviderError("Gemini returned a malformed response: no candidates")
            raise ProviderError("Gemini returned an empty response")

        return AIResponse(
            content=str(text),
            model=getattr(response, "model_version", None) or model,
            usage=self._usage(response),
            finish_reason=self._finish_reason(response),
            context_used=None,
        )

    def generate(self, request: AIRequest) -> AIResponse:
        try:
            model = request.model or self.model
            system_instruction, turns = self._split_messages(request)
            if not turns:
                raise ProviderError("Gemini request has no user content")

            params: dict[str, Any] = {
                "model": model,
                "contents": self._contents(turns),
            }
            config = self._generation_config(request, system_instruction)
            if config is not None:
                params["config"] = config

            response = self.client.models.generate_content(**params)
            return self._validate_response(response, model)

        except ProviderError:
            raise
        except Exception as e:
            raise self._classify_exception(e)

    def stream(self, request: AIRequest) -> Generator[StreamEvent, None, None]:
        """Stream a response from Gemini.

        Terminal / transport failures raise ProviderError so MentorService can
        retry. Empty streams also raise — they never emit a fabricated answer.
        """
        model = request.model or self.model
        system_instruction, turns = self._split_messages(request)
        if not turns:
            raise ProviderError("Gemini request has no user content")

        params: dict[str, Any] = {
            "model": model,
            "contents": self._contents(turns),
        }
        config = self._generation_config(request, system_instruction)
        if config is not None:
            params["config"] = config

        try:
            yield StreamEvent(
                type=StreamEventType.START,
                content="",
                metadata={"model": model},
            )

            full_content = ""
            finish_reason = None
            usage = None
            start_time = time.time()

            stream = self.client.models.generate_content_stream(**params)

            for chunk in stream:
                if time.time() - start_time > self.timeout:
                    raise ProviderError("Gemini request timed out: stream timeout exceeded")

                piece = self._extract_text(chunk) or ""
                if piece:
                    full_content += piece
                    yield StreamEvent(type=StreamEventType.DELTA, content=piece)

                chunk_finish = self._finish_reason(chunk)
                if chunk_finish:
                    finish_reason = chunk_finish
                chunk_usage = self._usage(chunk)
                if chunk_usage:
                    usage = chunk_usage

            if not full_content.strip():
                raise ProviderError("Gemini returned an empty response")

            metadata = {
                "model": model,
                "finish_reason": finish_reason,
                "usage": usage,
            }
            yield StreamEvent(type=StreamEventType.METADATA, metadata=metadata)
            yield StreamEvent(
                type=StreamEventType.COMPLETE,
                content=full_content,
                metadata=metadata,
            )

        except ProviderError:
            raise
        except Exception as e:
            raise self._classify_exception(e)

    def get_provider_name(self) -> str:
        return "gemini"
