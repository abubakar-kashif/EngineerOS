from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "EngineerOS API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite:///./engineeros.db"
    
    # AI Configuration
    AI_PROVIDER: str = "openai"
    AI_MODEL: str = "gpt-3.5-turbo"
    AI_API_KEY: Optional[str] = None
    AI_BASE_URL: Optional[str] = None
    AI_TIMEOUT_SECONDS: int = 60
    AI_MAX_OUTPUT_TOKENS: int = 1000
    AI_TEMPERATURE: float = 0.7
    
    # Email delivery (required for auth)
    EMAIL_DELIVERY: str = "console"   # <-- ADD THIS LINE
    
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

settings = Settings()