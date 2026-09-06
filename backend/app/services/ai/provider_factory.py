from app.core.config import settings
from app.services.ai.provider import AIProvider
from app.services.ai.types import ProviderError
from app.services.ai.providers.gemini_provider import GeminiProvider, DEFAULT_GEMINI_MODEL


class ProviderFactory:
    """Factory for creating AI provider instances based on configuration."""

    @staticmethod
    def get_provider() -> AIProvider:
        """Get the configured AI provider instance."""
        provider_name = (settings.AI_PROVIDER or "").strip().lower()

        if not provider_name:
            raise ProviderError("AI_PROVIDER is not configured")

        if provider_name in ("openai",):
            raise ProviderError(
                "OpenAI is no longer supported. Set AI_PROVIDER=gemini and configure AI_API_KEY."
            )

        if provider_name in ("gemini", "google", "google-gemini"):
            return GeminiProvider(
                api_key=settings.AI_API_KEY,
                model=settings.AI_MODEL or DEFAULT_GEMINI_MODEL,
                base_url=settings.AI_BASE_URL,
                timeout=settings.AI_TIMEOUT_SECONDS,
            )

        raise ProviderError(f"Unknown provider: {provider_name}")
