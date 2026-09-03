from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "EngineerOS API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite:///./engineeros.db"

    # Email delivery backend used by app/services/email_service.py.
    # "console" logs mail during development; register a real provider
    # (e.g. "smtp") in email_service._SENDERS for production.
    EMAIL_DELIVERY: str = "console"
    
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

settings = Settings()