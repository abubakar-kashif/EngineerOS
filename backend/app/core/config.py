from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

# Always load backend/.env regardless of the process working directory
# (uvicorn may be started from the repo root or the backend folder).
_BACKEND_DIR = Path(__file__).resolve().parents[2]
_ENV_FILE = _BACKEND_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "EngineerOS API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite:///./engineeros.db"

    # AI Configuration (server-side only — never expose AI_API_KEY to frontend)
    AI_PROVIDER: str = "openai"
    AI_MODEL: str = "gpt-3.5-turbo"
    AI_API_KEY: Optional[str] = None
    AI_BASE_URL: Optional[str] = None
    AI_TIMEOUT_SECONDS: int = 60
    AI_MAX_OUTPUT_TOKENS: int = 1000
    AI_TEMPERATURE: float = 0.7

    # Email delivery (backend-only — never expose SMTP credentials to frontend)
    # EMAIL_DELIVERY: "console" (dev) | "smtp" (configured environments)
    EMAIL_DELIVERY: str = "console"
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM: Optional[str] = None
    SMTP_USE_TLS: bool = True
    SMTP_USE_SSL: bool = False

    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


settings = Settings()
