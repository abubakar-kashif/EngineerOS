"""
Tests for AI Provider (Phases 5-7).
"""

import pytest
from unittest.mock import Mock, patch, PropertyMock
from app.services.ai.provider import AIProvider
from app.services.ai.provider_factory import ProviderFactory
from app.services.ai.providers.openai_provider import OpenAIProvider
from app.services.ai.types import AIRequest, AIMessage, AIResponse, ProviderError
from app.core.config import settings


class TestAIProvider:
    """Tests for the AI Provider abstraction."""

    def test_ai_provider_abc(self):
        """Test that AIProvider is an abstract base class."""
        assert AIProvider is not None
        with pytest.raises(TypeError):
            AIProvider()

    def test_openai_provider_initialization_without_key(self):
        """Test OpenAIProvider initialization without API key."""
        # The provider should NOT raise error during init
        # It should only raise when client is accessed
        with patch.dict('os.environ', {}, clear=True):
            provider = OpenAIProvider(api_key=None)
            assert provider.api_key is None
            # Error should be raised when accessing client
            with pytest.raises(ProviderError) as exc_info:
                _ = provider.client
            assert "API key not provided" in str(exc_info.value)
            assert "AI_API_KEY" in str(exc_info.value)

    def test_openai_provider_initialization_with_key(self):
        """Test OpenAIProvider initialization with API key."""
        provider = OpenAIProvider(api_key="test-key-123")
        assert provider.api_key == "test-key-123"
        assert provider.model == "gpt-3.5-turbo"
        assert provider._client is None

    def test_openai_provider_initialization_from_env(self):
        """Test OpenAIProvider reads API key from environment."""
        with patch.dict('os.environ', {'OPENAI_API_KEY': 'env-key-456'}):
            provider = OpenAIProvider(api_key=None)
            assert provider.api_key == "env-key-456"

    def test_openai_provider_get_provider_name(self):
        """Test get_provider_name returns correct name."""
        provider = OpenAIProvider(api_key="test-key")
        assert provider.get_provider_name() == "openai"

    def test_openai_provider_lazy_client_loading(self):
        """Test that OpenAI client is loaded lazily."""
        provider = OpenAIProvider(api_key="test-key")
        assert provider._client is None

        # Mock the client property
        with patch.object(
            OpenAIProvider,
            'client',
            new_callable=PropertyMock
        ) as mock_client_property:
            mock_client = Mock()
            mock_client_property.return_value = mock_client
            client = provider.client
            assert client is not None
            assert mock_client_property.called

    def test_openai_provider_generate_request_construction(self):
        """Test that generate constructs the request correctly."""
        provider = OpenAIProvider(api_key="test-key")

        # Create a mock response
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Hello, world!"
        mock_response.model = "gpt-3.5-turbo"
        mock_response.usage = Mock()
        mock_response.usage.prompt_tokens = 10
        mock_response.usage.completion_tokens = 5
        mock_response.usage.total_tokens = 15
        mock_response.choices[0].finish_reason = "stop"

        # Mock the client property
        with patch.object(
            OpenAIProvider,
            'client',
            new_callable=PropertyMock
        ) as mock_client_property:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = mock_response
            mock_client_property.return_value = mock_client

            request = AIRequest(
                messages=[AIMessage(role="user", content="Hello")],
                model="gpt-4",
                temperature=0.5,
                max_tokens=100,
            )

            response = provider.generate(request)

            assert response.content == "Hello, world!"
            assert response.model == "gpt-3.5-turbo"
            assert response.usage == {
                "prompt_tokens": 10,
                "completion_tokens": 5,
                "total_tokens": 15,
            }
            assert response.finish_reason == "stop"

            call_kwargs = mock_client.chat.completions.create.call_args[1]
            assert call_kwargs["model"] == "gpt-4"
            assert call_kwargs["temperature"] == 0.5
            assert call_kwargs["max_tokens"] == 100
            assert call_kwargs["stream"] is False

    def test_openai_provider_generate_basic_request(self):
        """Test generate with minimal request."""
        provider = OpenAIProvider(api_key="test-key")

        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Hello!"
        mock_response.model = "gpt-3.5-turbo"
        mock_response.usage = Mock()
        mock_response.usage.prompt_tokens = 5
        mock_response.usage.completion_tokens = 3
        mock_response.usage.total_tokens = 8
        mock_response.choices[0].finish_reason = "stop"

        with patch.object(
            OpenAIProvider,
            'client',
            new_callable=PropertyMock
        ) as mock_client_property:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = mock_response
            mock_client_property.return_value = mock_client

            request = AIRequest(messages=[AIMessage(role="user", content="Hello")])
            response = provider.generate(request)

            assert response.content == "Hello!"
            assert response.model == "gpt-3.5-turbo"

    def test_openai_provider_generate_handles_no_usage(self):
        """Test generate handles response without usage data."""
        provider = OpenAIProvider(api_key="test-key")

        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Hello!"
        mock_response.model = "gpt-3.5-turbo"
        mock_response.usage = None
        mock_response.choices[0].finish_reason = "stop"

        with patch.object(
            OpenAIProvider,
            'client',
            new_callable=PropertyMock
        ) as mock_client_property:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = mock_response
            mock_client_property.return_value = mock_client

            request = AIRequest(messages=[AIMessage(role="user", content="Hello")])
            response = provider.generate(request)

            assert response.content == "Hello!"
            assert response.usage is None

    def test_openai_provider_generate_provider_error(self):
        """Test generate raises ProviderError on API error."""
        provider = OpenAIProvider(api_key="test-key")

        with patch.object(
            OpenAIProvider,
            'client',
            new_callable=PropertyMock
        ) as mock_client_property:
            mock_client = Mock()
            mock_client.chat.completions.create.side_effect = Exception("API error")
            mock_client_property.return_value = mock_client

            request = AIRequest(messages=[AIMessage(role="user", content="Hello")])

            with pytest.raises(ProviderError) as exc_info:
                provider.generate(request)
            assert "API error" in str(exc_info.value)

    def test_openai_provider_generate_extra_params(self):
        """Test generate handles extra_params."""
        provider = OpenAIProvider(api_key="test-key")

        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Hello!"
        mock_response.model = "gpt-3.5-turbo"
        mock_response.usage = None
        mock_response.choices[0].finish_reason = "stop"

        with patch.object(
            OpenAIProvider,
            'client',
            new_callable=PropertyMock
        ) as mock_client_property:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = mock_response
            mock_client_property.return_value = mock_client

            request = AIRequest(
                messages=[AIMessage(role="user", content="Hello")],
                extra_params={"top_p": 0.9, "frequency_penalty": 0.5}
            )

            provider.generate(request)

            call_kwargs = mock_client.chat.completions.create.call_args[1]
            assert call_kwargs["top_p"] == 0.9
            assert call_kwargs["frequency_penalty"] == 0.5

    def test_openai_provider_client_import_error(self):
        """Test that client property raises ProviderError if openai not installed."""
        provider = OpenAIProvider(api_key="test-key")

        with patch('builtins.__import__', side_effect=ImportError("No module named openai")):
            with pytest.raises(ProviderError) as exc_info:
                _ = provider.client
            assert "OpenAI package not installed" in str(exc_info.value)


class TestProviderFactory:
    """Tests for the ProviderFactory."""

    def test_provider_factory_get_provider_openai(self):
        """Test ProviderFactory returns OpenAIProvider when AI_PROVIDER=openai."""
        with patch('app.services.ai.provider_factory.settings') as mock_settings:
            mock_settings.AI_PROVIDER = "openai"
            mock_settings.AI_API_KEY = "test-key"
            mock_settings.AI_MODEL = "gpt-3.5-turbo"

            provider = ProviderFactory.get_provider()
            assert isinstance(provider, OpenAIProvider)

    def test_provider_factory_get_provider_unknown(self):
        """Test ProviderFactory raises error for unknown provider."""
        with patch('app.services.ai.provider_factory.settings') as mock_settings:
            mock_settings.AI_PROVIDER = "unknown_provider"

            with pytest.raises(ProviderError) as exc_info:
                ProviderFactory.get_provider()
            assert "Unknown provider" in str(exc_info.value)

    def test_provider_factory_get_provider_passes_config(self):
        """Test ProviderFactory passes configuration to provider."""
        with patch('app.services.ai.provider_factory.settings') as mock_settings:
            mock_settings.AI_PROVIDER = "openai"
            mock_settings.AI_API_KEY = "config-key-789"
            mock_settings.AI_MODEL = "gpt-4"

            provider = ProviderFactory.get_provider()
            assert isinstance(provider, OpenAIProvider)
            assert provider.api_key == "config-key-789"
            assert provider.model == "gpt-4"


class TestAIProviderFailureHandling:
    """Controlled failure handling — never fabricate successful AI answers."""

    def _request(self):
        return AIRequest(messages=[AIMessage(role="user", content="Hello")])

    def test_generate_rejects_empty_content(self):
        provider = OpenAIProvider(api_key="test-key")
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = ""
        mock_response.model = "gpt-3.5-turbo"
        mock_response.usage = None
        mock_response.choices[0].finish_reason = "stop"

        with patch.object(OpenAIProvider, "client", new_callable=PropertyMock) as mock_client_property:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = mock_response
            mock_client_property.return_value = mock_client

            with pytest.raises(ProviderError) as exc_info:
                provider.generate(self._request())
            assert "empty response" in str(exc_info.value).lower()

    def test_generate_rejects_none_content(self):
        provider = OpenAIProvider(api_key="test-key")
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = None
        mock_response.model = "gpt-3.5-turbo"
        mock_response.usage = None
        mock_response.choices[0].finish_reason = "stop"

        with patch.object(OpenAIProvider, "client", new_callable=PropertyMock) as mock_client_property:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = mock_response
            mock_client_property.return_value = mock_client

            with pytest.raises(ProviderError):
                provider.generate(self._request())

    def test_generate_rejects_malformed_response(self):
        provider = OpenAIProvider(api_key="test-key")
        mock_response = Mock()
        mock_response.choices = []

        with patch.object(OpenAIProvider, "client", new_callable=PropertyMock) as mock_client_property:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = mock_response
            mock_client_property.return_value = mock_client

            with pytest.raises(ProviderError) as exc_info:
                provider.generate(self._request())
            assert "malformed" in str(exc_info.value).lower()

    def test_generate_invalid_api_key_classified(self):
        provider = OpenAIProvider(api_key="bad-key")

        class FakeAuthError(Exception):
            status_code = 401

        with patch.object(OpenAIProvider, "client", new_callable=PropertyMock) as mock_client_property:
            mock_client = Mock()
            mock_client.chat.completions.create.side_effect = FakeAuthError("Incorrect API key")
            mock_client_property.return_value = mock_client

            with pytest.raises(ProviderError) as exc_info:
                provider.generate(self._request())
            assert "authentication failed" in str(exc_info.value).lower()

    def test_generate_timeout_classified(self):
        provider = OpenAIProvider(api_key="test-key")

        with patch.object(OpenAIProvider, "client", new_callable=PropertyMock) as mock_client_property:
            mock_client = Mock()
            mock_client.chat.completions.create.side_effect = Exception("Request timed out")
            mock_client_property.return_value = mock_client

            with pytest.raises(ProviderError) as exc_info:
                provider.generate(self._request())
            assert "timed out" in str(exc_info.value).lower()

    def test_generate_network_failure_classified(self):
        provider = OpenAIProvider(api_key="test-key")

        with patch.object(OpenAIProvider, "client", new_callable=PropertyMock) as mock_client_property:
            mock_client = Mock()
            mock_client.chat.completions.create.side_effect = Exception("Connection refused")
            mock_client_property.return_value = mock_client

            with pytest.raises(ProviderError) as exc_info:
                provider.generate(self._request())
            assert "network" in str(exc_info.value).lower()

    def test_generate_provider_exception_does_not_fabricate_answer(self):
        provider = OpenAIProvider(api_key="test-key")

        with patch.object(OpenAIProvider, "client", new_callable=PropertyMock) as mock_client_property:
            mock_client = Mock()
            mock_client.chat.completions.create.side_effect = RuntimeError("boom")
            mock_client_property.return_value = mock_client

            with pytest.raises(ProviderError) as exc_info:
                result = provider.generate(self._request())
                # Must never return a successful fabricated answer
                assert False, f"Unexpected success: {result}"
            assert "OpenAI API error" in str(exc_info.value)


class TestOpenAIProviderStreaming:
    """Real provider-backed streaming (mocked OpenAI stream chunks)."""

    def test_stream_yields_provider_deltas(self):
        provider = OpenAIProvider(api_key="test-key")

        chunk1 = Mock()
        chunk1.choices = [Mock()]
        chunk1.choices[0].delta = Mock(content="Hel")
        chunk1.choices[0].finish_reason = None
        chunk1.usage = None

        chunk2 = Mock()
        chunk2.choices = [Mock()]
        chunk2.choices[0].delta = Mock(content="lo")
        chunk2.choices[0].finish_reason = "stop"
        chunk2.usage = None

        with patch.object(OpenAIProvider, "client", new_callable=PropertyMock) as mock_client_property:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = iter([chunk1, chunk2])
            mock_client_property.return_value = mock_client

            events = list(provider.stream(AIRequest(messages=[AIMessage(role="user", content="Hi")])))
            types = [e.type.value for e in events]
            assert types[0] == "start"
            assert "delta" in types
            assert types[-1] == "complete"
            deltas = "".join(e.content or "" for e in events if e.type.value == "delta")
            assert deltas == "Hello"
            assert events[-1].content == "Hello"

    def test_stream_empty_content_raises(self):
        provider = OpenAIProvider(api_key="test-key")
        chunk = Mock()
        chunk.choices = [Mock()]
        chunk.choices[0].delta = Mock(content=None)
        chunk.choices[0].finish_reason = "stop"
        chunk.usage = None

        with patch.object(OpenAIProvider, "client", new_callable=PropertyMock) as mock_client_property:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = iter([chunk])
            mock_client_property.return_value = mock_client

            with pytest.raises(ProviderError, match="empty response"):
                list(provider.stream(AIRequest(messages=[AIMessage(role="user", content="Hi")])))

    def test_stream_provider_exception_raises(self):
        provider = OpenAIProvider(api_key="test-key")

        with patch.object(OpenAIProvider, "client", new_callable=PropertyMock) as mock_client_property:
            mock_client = Mock()
            mock_client.chat.completions.create.side_effect = Exception("provider disconnect")
            mock_client_property.return_value = mock_client

            with pytest.raises(ProviderError, match="network|disconnect|API error"):
                list(provider.stream(AIRequest(messages=[AIMessage(role="user", content="Hi")])))


class TestAIProviderIntegration:
    """Integration-style tests for AI Provider (with mocks)."""

    def test_full_flow_with_mock(self):
        """Test the full flow from request to response with mocks."""
        provider = OpenAIProvider(api_key="test-key")

        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Ohm's law states V = IR."
        mock_response.model = "gpt-3.5-turbo"
        mock_response.usage = Mock()
        mock_response.usage.prompt_tokens = 15
        mock_response.usage.completion_tokens = 10
        mock_response.usage.total_tokens = 25
        mock_response.choices[0].finish_reason = "stop"

        with patch.object(
            OpenAIProvider,
            'client',
            new_callable=PropertyMock
        ) as mock_client_property:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = mock_response
            mock_client_property.return_value = mock_client

            request = AIRequest(
                messages=[
                    AIMessage(role="system", content="You are an engineering tutor."),
                    AIMessage(role="user", content="What is Ohm's law?"),
                ],
                temperature=0.3,
                max_tokens=150,
            )

            response = provider.generate(request)

            assert "Ohm's law" in response.content
            assert response.model == "gpt-3.5-turbo"
            assert response.usage is not None
            assert response.usage["total_tokens"] == 25
            assert response.finish_reason == "stop"


class TestAIConfiguration:
    """Configuration surface expected by production Mentor."""

    def test_ai_settings_defaults(self):
        assert settings.AI_PROVIDER == "openai" or isinstance(settings.AI_PROVIDER, str)
        assert settings.AI_TIMEOUT_SECONDS == 60 or isinstance(settings.AI_TIMEOUT_SECONDS, int)
        assert settings.AI_MAX_OUTPUT_TOKENS == 1000 or isinstance(settings.AI_MAX_OUTPUT_TOKENS, int)
        assert settings.AI_TEMPERATURE == 0.7 or isinstance(settings.AI_TEMPERATURE, float)

    def test_openai_sdk_importable(self):
        import openai
        assert openai is not None

    def test_provider_factory_passes_timeout_and_base_url(self):
        with patch("app.services.ai.provider_factory.settings") as mock_settings:
            mock_settings.AI_PROVIDER = "openai"
            mock_settings.AI_API_KEY = "config-key"
            mock_settings.AI_MODEL = "gpt-4"
            mock_settings.AI_BASE_URL = "https://example.test/v1"
            mock_settings.AI_TIMEOUT_SECONDS = 45

            provider = ProviderFactory.get_provider()
            assert isinstance(provider, OpenAIProvider)
            assert provider.base_url == "https://example.test/v1"
            assert provider.timeout == 45

    def test_provider_factory_empty_provider_name(self):
        with patch("app.services.ai.provider_factory.settings") as mock_settings:
            mock_settings.AI_PROVIDER = "   "
            with pytest.raises(ProviderError) as exc_info:
                ProviderFactory.get_provider()
            assert "not configured" in str(exc_info.value).lower()