from app.core.config import settings
from app.services.ai.provider import AIProvider
from app.services.ai.types import ProviderError
from app.services.ai.providers.openai_provider import OpenAIProvider


class ProviderFactory:
    """Factory for creating AI provider instances based on configuration."""

    @staticmethod
    def get_provider() -> AIProvider:
        """Get the configured AI provider instance."""
        provider_name = (settings.AI_PROVIDER or "").strip().lower()

        if not provider_name:
            raise ProviderError("AI_PROVIDER is not configured")

        if provider_name == "openai":
            return OpenAIProvider(
                api_key=settings.AI_API_KEY,
                model=settings.AI_MODEL,
                base_url=settings.AI_BASE_URL,
                timeout=settings.AI_TIMEOUT_SECONDS,
            )

        raise ProviderError(f"Unknown provider: {provider_name}")
