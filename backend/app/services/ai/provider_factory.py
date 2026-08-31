from app.core.config import settings
from app.services.ai.provider import AIProvider, ProviderError
from app.services.ai.providers.openai_provider import OpenAIProvider


class ProviderFactory:
    """Factory for creating AI provider instances based on configuration."""

    @staticmethod
    def get_provider() -> AIProvider:
        """Get the configured AI provider instance."""
        provider_name = settings.AI_PROVIDER.lower()

        if provider_name == "openai":
            return OpenAIProvider(
                api_key=settings.AI_API_KEY,
                model=settings.AI_MODEL,
                base_url=settings.AI_BASE_URL,      # ADD
                timeout=settings.AI_TIMEOUT_SECONDS, # ADD
            )
        else:
            raise ProviderError(f"Unknown provider: {provider_name}")