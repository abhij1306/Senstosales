from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import SecretStr, PostgresDsn, AnyUrl
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
    # Default to the existing hardcoded path structure for backward compatibility
    # relative to backend/ (CWD)
    DATABASE_URL: str = "sqlite:///../database/business.db" 

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["*"]

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore" # Ignore extra fields in .env
    )

settings = Settings()
