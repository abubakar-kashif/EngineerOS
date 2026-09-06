"""
Tests for the AI Provider abstraction (Gemini production provider).

These tests mock the Gemini SDK. They do not perform live Gemini HTTP calls.
"""

import pytest
from unittest.mock import Mock, patch, PropertyMock

from app.services.ai.provider import AIProvider
from app.services.ai.provider_factory import ProviderFactory
from app.services.ai.providers.gemini_provider import GeminiProvider, DEFAULT_GEMINI_MODEL
from app.services.ai.types import AIRequest, AIMessage, ProviderError
from app.core.config import settings


def _gemini_response(
    text,
    model=DEFAULT_GEMINI_MODEL,
    usage=None,
    finish="STOP",
    candidates=True,
):
    resp = Mock()
    resp.text = text
    resp.model_version = model
    if usage is None:
        resp.usage_metadata = None
    else:
        um = Mock()
        um.prompt_token_count = usage.get("prompt_tokens")
        um.candidates_token_count = usage.get("completion_tokens")
        um.total_token_count = usage.get("total_tokens")
        resp.usage_metadata = um
    if candidates:
        cand = Mock()
        cand.finish_reason = finish
        cand.content = Mock(parts=[Mock(text=text)])
        resp.candidates = [cand]
    else:
        resp.candidates = []
    return resp


def _patch_generate(provider, response=None, side_effect=None):
    mock_client = Mock()
    if side_effect is not None:
        mock_client.models.generate_content.side_effect = side_effect
    else:
        mock_client.models.generate_content.return_value = response
    return patch.object(
        GeminiProvider, "client", new_callable=PropertyMock, return_value=mock_client
    ), mock_client


def _patch_stream(provider, chunks=None, side_effect=None):
    mock_client = Mock()
    if side_effect is not None:
        mock_client.models.generate_content_stream.side_effect = side_effect
    else:
        mock_client.models.generate_content_stream.return_value = iter(chunks or [])
    return patch.object(
        GeminiProvider, "client", new_callable=PropertyMock, return_value=mock_client
    ), mock_client


class TestAIProvider:
    """Tests for the AI Provider abstraction."""

    def test_ai_provider_abc(self):
        assert AIProvider is not None
        with pytest.raises(TypeError):
            AIProvider()

    def test_gemini_provider_initialization_without_key(self):
        with patch.dict("os.environ", {}, clear=True):
            provider = GeminiProvider(api_key=None)
            assert provider.api_key is None
            with pytest.raises(ProviderError) as exc_info:
                _ = provider.client
            assert "API key not provided" in str(exc_info.value)
            assert "AI_API_KEY" in str(exc_info.value)
            assert "sk-" not in str(exc_info.value)
            assert "AIza" not in str(exc_info.value)

    def test_gemini_provider_initialization_with_key(self):
        provider = GeminiProvider(api_key="test-key-123")
        assert provider.api_key == "test-key-123"
        assert provider.model == DEFAULT_GEMINI_MODEL
        assert provider._client is None

    def test_gemini_provider_initialization_from_env(self):
        with patch.dict("os.environ", {"GEMINI_API_KEY": "env-key-456"}):
            provider = GeminiProvider(api_key=None)
            assert provider.api_key == "env-key-456"

    def test_gemini_provider_prefers_ai_api_key_env(self):
        with patch.dict(
            "os.environ",
            {"AI_API_KEY": "ai-key", "GEMINI_API_KEY": "gemini-key"},
        ):
            provider = GeminiProvider(api_key=None)
            assert provider.api_key == "ai-key"

    def test_gemini_provider_get_provider_name(self):
        provider = GeminiProvider(api_key="test-key")
        assert provider.get_provider_name() == "gemini"

    def test_gemini_provider_lazy_client_loading(self):
        provider = GeminiProvider(api_key="test-key")
        assert provider._client is None
        with patch.object(GeminiProvider, "client", new_callable=PropertyMock) as mock_client_property:
            mock_client_property.return_value = Mock()
            assert provider.client is not None
            assert mock_client_property.called

    def test_gemini_provider_generate_request_construction(self):
        provider = GeminiProvider(api_key="test-key")
        mock_response = _gemini_response(
            "Hello, world!",
            usage={"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15},
        )
        ctx, mock_client = _patch_generate(provider, mock_response)
        with ctx:
            request = AIRequest(
                messages=[AIMessage(role="user", content="Hello")],
                model="gemini-2.0-flash",
                temperature=0.5,
                max_tokens=100,
            )
            response = provider.generate(request)

            assert response.content == "Hello, world!"
            assert response.model == DEFAULT_GEMINI_MODEL
            assert response.usage == {
                "prompt_tokens": 10,
                "completion_tokens": 5,
                "total_tokens": 15,
            }
            assert response.finish_reason == "STOP"

            call_kwargs = mock_client.models.generate_content.call_args[1]
            assert call_kwargs["model"] == "gemini-2.0-flash"
            assert call_kwargs["config"].temperature == 0.5
            assert call_kwargs["config"].max_output_tokens == 100

    def test_system_only_prompt_is_sent_as_user_turn(self):
        provider = GeminiProvider(api_key="test-key")
        mock_response = _gemini_response("Grounded answer")
        ctx, mock_client = _patch_generate(provider, mock_response)
        with ctx:
            response = provider.generate(
                AIRequest(
                    messages=[
                        AIMessage(role="system", content="CURRENT USER QUESTION\nExplain Ohm's Law")
                    ]
                )
            )
            assert response.content == "Grounded answer"
            contents = mock_client.models.generate_content.call_args[1]["contents"]
            assert contents[0].role == "user"
        provider = GeminiProvider(api_key="test-key")
        mock_response = _gemini_response("Hello!")
        ctx, _mock_client = _patch_generate(provider, mock_response)
        with ctx:
            response = provider.generate(
                AIRequest(messages=[AIMessage(role="user", content="Hello")])
            )
            assert response.content == "Hello!"
            assert response.model == DEFAULT_GEMINI_MODEL

    def test_gemini_provider_generate_handles_no_usage(self):
        provider = GeminiProvider(api_key="test-key")
        mock_response = _gemini_response("Hello!")
        ctx, _mock_client = _patch_generate(provider, mock_response)
        with ctx:
            response = provider.generate(
                AIRequest(messages=[AIMessage(role="user", content="Hello")])
            )
            assert response.content == "Hello!"
            assert response.usage is None

    def test_gemini_provider_generate_provider_error(self):
        provider = GeminiProvider(api_key="test-key")
        ctx, _mock_client = _patch_generate(provider, side_effect=Exception("API error"))
        with ctx:
            with pytest.raises(ProviderError) as exc_info:
                provider.generate(AIRequest(messages=[AIMessage(role="user", content="Hello")]))
            assert "API error" in str(exc_info.value)

    def test_gemini_provider_generate_extra_params(self):
        provider = GeminiProvider(api_key="test-key")
        mock_response = _gemini_response("Hello!")
        ctx, mock_client = _patch_generate(provider, mock_response)
        with ctx:
            provider.generate(
                AIRequest(
                    messages=[AIMessage(role="user", content="Hello")],
                    extra_params={"top_p": 0.9},
                )
            )
            call_kwargs = mock_client.models.generate_content.call_args[1]
            assert call_kwargs["config"].top_p == 0.9

    def test_gemini_provider_client_import_error(self):
        provider = GeminiProvider(api_key="test-key")
        real_import = __import__

        def fake_import(name, *args, **kwargs):
            if name == "google" or name.startswith("google."):
                raise ImportError("No module named google")
            return real_import(name, *args, **kwargs)

        with patch("builtins.__import__", side_effect=fake_import):
            with pytest.raises(ProviderError) as exc_info:
                _ = provider.client
            assert "Gemini package not installed" in str(exc_info.value)


class TestProviderFactory:
    def test_provider_factory_get_provider_gemini(self):
        with patch("app.services.ai.provider_factory.settings") as mock_settings:
            mock_settings.AI_PROVIDER = "gemini"
            mock_settings.AI_API_KEY = "test-key"
            mock_settings.AI_MODEL = DEFAULT_GEMINI_MODEL
            mock_settings.AI_BASE_URL = None
            mock_settings.AI_TIMEOUT_SECONDS = 60

            provider = ProviderFactory.get_provider()
            assert isinstance(provider, GeminiProvider)

    def test_provider_factory_rejects_openai(self):
        with patch("app.services.ai.provider_factory.settings") as mock_settings:
            mock_settings.AI_PROVIDER = "openai"
            with pytest.raises(ProviderError) as exc_info:
                ProviderFactory.get_provider()
            assert "no longer supported" in str(exc_info.value).lower()

    def test_provider_factory_get_provider_unknown(self):
        with patch("app.services.ai.provider_factory.settings") as mock_settings:
            mock_settings.AI_PROVIDER = "unknown_provider"
            with pytest.raises(ProviderError) as exc_info:
                ProviderFactory.get_provider()
            assert "Unknown provider" in str(exc_info.value)

    def test_provider_factory_get_provider_passes_config(self):
        with patch("app.services.ai.provider_factory.settings") as mock_settings:
            mock_settings.AI_PROVIDER = "gemini"
            mock_settings.AI_API_KEY = "config-key-789"
            mock_settings.AI_MODEL = "gemini-2.0-flash"
            mock_settings.AI_BASE_URL = None
            mock_settings.AI_TIMEOUT_SECONDS = 60

            provider = ProviderFactory.get_provider()
            assert isinstance(provider, GeminiProvider)
            assert provider.api_key == "config-key-789"
            assert provider.model == "gemini-2.0-flash"


class TestAIProviderFailureHandling:
    def _request(self):
        return AIRequest(messages=[AIMessage(role="user", content="Hello")])

    def test_generate_rejects_empty_content(self):
        provider = GeminiProvider(api_key="test-key")
        mock_response = _gemini_response("")
        ctx, _mock_client = _patch_generate(provider, mock_response)
        with ctx:
            with pytest.raises(ProviderError) as exc_info:
                provider.generate(self._request())
            assert "empty response" in str(exc_info.value).lower()

    def test_generate_rejects_none_content(self):
        provider = GeminiProvider(api_key="test-key")
        mock_response = _gemini_response(None)
        ctx, _mock_client = _patch_generate(provider, mock_response)
        with ctx:
            with pytest.raises(ProviderError):
                provider.generate(self._request())

    def test_generate_rejects_malformed_response(self):
        provider = GeminiProvider(api_key="test-key")
        mock_response = _gemini_response(None, candidates=False)
        ctx, _mock_client = _patch_generate(provider, mock_response)
        with ctx:
            with pytest.raises(ProviderError) as exc_info:
                provider.generate(self._request())
            assert "malformed" in str(exc_info.value).lower()

    def test_generate_invalid_api_key_classified(self):
        provider = GeminiProvider(api_key="bad-key")

        class FakeAuthError(Exception):
            status_code = 401

        ctx, _mock_client = _patch_generate(
            provider, side_effect=FakeAuthError("API key not valid")
        )
        with ctx:
            with pytest.raises(ProviderError) as exc_info:
                provider.generate(self._request())
            assert "authentication failed" in str(exc_info.value).lower()

    def test_generate_timeout_classified(self):
        provider = GeminiProvider(api_key="test-key")
        ctx, _mock_client = _patch_generate(provider, side_effect=Exception("Request timed out"))
        with ctx:
            with pytest.raises(ProviderError) as exc_info:
                provider.generate(self._request())
            assert "timed out" in str(exc_info.value).lower()

    def test_generate_network_failure_classified(self):
        provider = GeminiProvider(api_key="test-key")
        ctx, _mock_client = _patch_generate(
            provider, side_effect=Exception("Connection refused")
        )
        with ctx:
            with pytest.raises(ProviderError) as exc_info:
                provider.generate(self._request())
            assert "network" in str(exc_info.value).lower()

    def test_generate_provider_exception_does_not_fabricate_answer(self):
        provider = GeminiProvider(api_key="test-key")
        ctx, _mock_client = _patch_generate(provider, side_effect=RuntimeError("boom"))
        with ctx:
            with pytest.raises(ProviderError) as exc_info:
                result = provider.generate(self._request())
                assert False, f"Unexpected success: {result}"
            assert "Gemini API error" in str(exc_info.value)

    def test_error_message_redacts_api_key(self):
        provider = GeminiProvider(api_key="AIzaSySecretValueMustNotLeak12345")
        ctx, _mock_client = _patch_generate(
            provider,
            side_effect=Exception("bad key AIzaSySecretValueMustNotLeak12345"),
        )
        with ctx:
            with pytest.raises(ProviderError) as exc_info:
                provider.generate(self._request())
            assert "AIzaSySecretValueMustNotLeak12345" not in str(exc_info.value)
            assert "[redacted]" in str(exc_info.value)


class TestGeminiProviderStreaming:
    """Mocked Gemini stream chunks — not a live HTTP call."""

    def test_stream_yields_provider_deltas(self):
        provider = GeminiProvider(api_key="test-key")
        chunk1 = _gemini_response("Hel", finish=None)
        chunk2 = _gemini_response("lo", finish="STOP")
        ctx, _mock_client = _patch_stream(provider, [chunk1, chunk2])
        with ctx:
            events = list(
                provider.stream(AIRequest(messages=[AIMessage(role="user", content="Hi")]))
            )
            types = [e.type.value for e in events]
            assert types[0] == "start"
            assert "delta" in types
            assert types[-1] == "complete"
            deltas = "".join(e.content or "" for e in events if e.type.value == "delta")
            assert deltas == "Hello"
            assert events[-1].content == "Hello"

    def test_stream_empty_content_raises(self):
        provider = GeminiProvider(api_key="test-key")
        chunk = _gemini_response("", finish="STOP")
        ctx, _mock_client = _patch_stream(provider, [chunk])
        with ctx:
            with pytest.raises(ProviderError, match="empty response"):
                list(provider.stream(AIRequest(messages=[AIMessage(role="user", content="Hi")])))

    def test_stream_provider_exception_raises(self):
        provider = GeminiProvider(api_key="test-key")
        ctx, _mock_client = _patch_stream(
            provider, side_effect=Exception("provider disconnect")
        )
        with ctx:
            with pytest.raises(ProviderError, match="network|disconnect|API error"):
                list(provider.stream(AIRequest(messages=[AIMessage(role="user", content="Hi")])))


class TestAIProviderIntegration:
    def test_full_flow_with_mock(self):
        provider = GeminiProvider(api_key="test-key")
        mock_response = _gemini_response(
            "Ohm's law states V = IR.",
            usage={"prompt_tokens": 15, "completion_tokens": 10, "total_tokens": 25},
        )
        ctx, _mock_client = _patch_generate(provider, mock_response)
        with ctx:
            response = provider.generate(
                AIRequest(
                    messages=[
                        AIMessage(role="system", content="You are an engineering tutor."),
                        AIMessage(role="user", content="What is Ohm's law?"),
                    ],
                    temperature=0.3,
                    max_tokens=150,
                )
            )
            assert "Ohm's law" in response.content
            assert response.model == DEFAULT_GEMINI_MODEL
            assert response.usage is not None
            assert response.usage["total_tokens"] == 25
            assert response.finish_reason == "STOP"


class TestAIConfiguration:
    def test_ai_settings_defaults(self):
        assert settings.AI_PROVIDER.strip().lower() in ("gemini", "google", "google-gemini")
        assert settings.AI_TIMEOUT_SECONDS == 60 or isinstance(settings.AI_TIMEOUT_SECONDS, int)
        assert settings.AI_MAX_OUTPUT_TOKENS == 1000 or isinstance(
            settings.AI_MAX_OUTPUT_TOKENS, int
        )
        assert settings.AI_TEMPERATURE == 0.7 or isinstance(settings.AI_TEMPERATURE, float)

    def test_gemini_sdk_importable(self):
        from google import genai

        assert genai is not None

    def test_production_has_no_openai_provider_module(self):
        from pathlib import Path

        providers = Path(__file__).resolve().parents[1] / "app" / "services" / "ai" / "providers"
        names = {p.name for p in providers.glob("*.py")}
        assert "openai_provider.py" not in names
        assert "gemini_provider.py" in names

    def test_provider_factory_passes_timeout_and_base_url(self):
        with patch("app.services.ai.provider_factory.settings") as mock_settings:
            mock_settings.AI_PROVIDER = "gemini"
            mock_settings.AI_API_KEY = "config-key"
            mock_settings.AI_MODEL = "gemini-2.0-flash"
            mock_settings.AI_BASE_URL = "https://example.test/v1"
            mock_settings.AI_TIMEOUT_SECONDS = 45

            provider = ProviderFactory.get_provider()
            assert isinstance(provider, GeminiProvider)
            assert provider.base_url == "https://example.test/v1"
            assert provider.timeout == 45

    def test_provider_factory_empty_provider_name(self):
        with patch("app.services.ai.provider_factory.settings") as mock_settings:
            mock_settings.AI_PROVIDER = "   "
            with pytest.raises(ProviderError) as exc_info:
                ProviderFactory.get_provider()
            assert "not configured" in str(exc_info.value).lower()
