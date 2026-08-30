"""
Tests for AI Provider (Phases 5-7).
"""

import pytest
from unittest.mock import Mock, patch
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
        # Cannot instantiate abstract class directly
        with pytest.raises(TypeError):
            AIProvider()

    def test_openai_provider_initialization_without_key(self):
        """Test OpenAIProvider initialization without API key raises error."""
        with patch.dict('os.environ', {}, clear=True):
            with pytest.raises(ProviderError) as exc_info:
                OpenAIProvider(api_key=None)
            assert "API key not provided" in str(exc_info.value)

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

        # Accessing client property should load it
        with patch('openai.OpenAI') as mock_openai:
            client = provider.client
            assert provider._client is not None
            assert mock_openai.called

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

        # Patch the client
        with patch.object(provider, 'client') as mock_client:
            mock_client.chat.completions.create.return_value = mock_response

            # Create request
            request = AIRequest(
                messages=[
                    AIMessage(role="user", content="Hello")
                ],
                model="gpt-4",
                temperature=0.5,
                max_tokens=100,
            )

            response = provider.generate(request)

            # Verify the response
            assert response.content == "Hello, world!"
            assert response.model == "gpt-3.5-turbo"
            assert response.usage == {
                "prompt_tokens": 10,
                "completion_tokens": 5,
                "total_tokens": 15,
            }
            assert response.finish_reason == "stop"

            # Verify the request was constructed correctly
            mock_client.chat.completions.create.assert_called_once()
            call_kwargs = mock_client.chat.completions.create.call_args[1]
            assert call_kwargs["model"] == "gpt-4"
            assert call_kwargs["temperature"] == 0.5
            assert call_kwargs["max_tokens"] == 100
            assert call_kwargs["stream"] is False

    def test_openai_provider_generate_basic_request(self):
        """Test generate with minimal request (no optional params)."""
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

        with patch.object(provider, 'client') as mock_client:
            mock_client.chat.completions.create.return_value = mock_response

            request = AIRequest(
                messages=[AIMessage(role="user", content="Hello")]
            )

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

        with patch.object(provider, 'client') as mock_client:
            mock_client.chat.completions.create.return_value = mock_response

            request = AIRequest(
                messages=[AIMessage(role="user", content="Hello")]
            )

            response = provider.generate(request)

            assert response.content == "Hello!"
            assert response.usage is None

    def test_openai_provider_generate_provider_error(self):
        """Test generate raises ProviderError on API error."""
        provider = OpenAIProvider(api_key="test-key")

        with patch.object(provider, 'client') as mock_client:
            mock_client.chat.completions.create.side_effect = Exception("API error")

            request = AIRequest(
                messages=[AIMessage(role="user", content="Hello")]
            )

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

        with patch.object(provider, 'client') as mock_client:
            mock_client.chat.completions.create.return_value = mock_response

            request = AIRequest(
                messages=[AIMessage(role="user", content="Hello")],
                extra_params={
                    "top_p": 0.9,
                    "frequency_penalty": 0.5,
                }
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

        with patch.object(provider, 'client') as mock_client:
            mock_client.chat.completions.create.return_value = mock_response

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

    def test_provider_factory_integration(self):
        """Test ProviderFactory with actual config."""
        # Note: This test uses the actual settings from config.py
        # If AI_API_KEY is not set, the provider will raise an error
        # This is expected behavior
        with patch('app.services.ai.provider_factory.settings') as mock_settings:
            mock_settings.AI_PROVIDER = "openai"
            mock_settings.AI_API_KEY = "test-key"
            mock_settings.AI_MODEL = "gpt-3.5-turbo"

            provider = ProviderFactory.get_provider()
            assert isinstance(provider, OpenAIProvider)
            assert provider.get_provider_name() == "openai"