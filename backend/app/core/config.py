from __future__ import annotations

from functools import lru_cache

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "PianoFlow API"
    environment: str = "local"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"
    cors_origins: list[str] | str = Field(
        default_factory=lambda: [
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )
    database_url: str = Field(default="", validation_alias=AliasChoices("DATABASE_URL"))
    auto_create_tables: bool = Field(default=False, validation_alias=AliasChoices("AUTO_CREATE_TABLES"))
    supabase_url: str = Field(default="", validation_alias=AliasChoices("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"))
    supabase_publishable_key: str = Field(
        default="",
        validation_alias=AliasChoices("SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    )
    supabase_secret_key: str = Field(default="", validation_alias=AliasChoices("SUPABASE_SECRET_KEY"))
    supabase_jwks_url: str = Field(default="", validation_alias=AliasChoices("SUPABASE_JWKS_URL"))
    auth_secret: str = Field(default="", validation_alias=AliasChoices("AUTH_SECRET"))
    auth_seed_username: str = Field(default="admin", validation_alias=AliasChoices("AUTH_SEED_USERNAME"))
    auth_seed_password: str = Field(default="admin12345", validation_alias=AliasChoices("AUTH_SEED_PASSWORD"))
    auth_seed_role: str = Field(default="admin", validation_alias=AliasChoices("AUTH_SEED_ROLE"))
    auth_cookie_secure: bool = Field(default=False, validation_alias=AliasChoices("AUTH_COOKIE_SECURE"))

    llm_enabled: bool = Field(default=False, validation_alias=AliasChoices("LLM_ENABLED", "OPENAI__ENABLED"))
    llm_base_url: str = Field(
        default="https://api.openai.com/v1",
        validation_alias=AliasChoices("LLM_BASE_URL", "OPENAI__BASE_URL"),
    )
    llm_api_key: str = Field(default="", validation_alias=AliasChoices("LLM_API_KEY", "OPENAI__API_KEY"))
    llm_model: str = Field(default="", validation_alias=AliasChoices("LLM_MODEL", "OPENAI__MODEL"))
    llm_timeout_seconds: float = 45.0
    ai_history_limit: int = 8

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @field_validator("cors_origins")
    @classmethod
    def normalize_cors_origins(cls, value: list[str] | str) -> list[str]:
        if isinstance(value, str):
            return [value]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
