from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import SecretStr
from typing import Optional


class Settings(BaseSettings):
    # App Info
    PROJECT_NAME: str = "SenstoSales"
    API_V1_STR: str = "/api"
    ENV_MODE: str = "dev"  # dev, prod, test

    # Security & API Keys
    # Making Optional because OpenRouter might be used instead, or user hasn't set them yet.
    # Strict key checks can happen in the service definition if needed, or we validation logic below.
    GROQ_API_KEY: Optional[SecretStr] = None
    OPENAI_API_KEY: Optional[SecretStr] = None
    OPENROUTER_API_KEY: Optional[SecretStr] = None

    # Database
    # Relative path from backend/ directory (where main.py runs)
    # to root/db/business.db
    DATABASE_URL: str = "sqlite:///../db/business.db"

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["*"]  # Allow all origins for development

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",  # Ignore extra fields in .env
    )


settings = Settings()
