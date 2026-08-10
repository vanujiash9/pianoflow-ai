from __future__ import annotations

from functools import lru_cache

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "PianoFlow API"
    environment: str = "local"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"
    cors_origins: list[str] | str = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )
    database_url: str = "sqlite:///./pianoflow.db"
    auto_create_tables: bool = True

    llm_enabled: bool = Field(default=False, validation_alias=AliasChoices("LLM_ENABLED", "OPENAI__ENABLED"))
    llm_base_url: str = Field(
        default="https://api.openai.com/v1",
        validation_alias=AliasChoices("LLM_BASE_URL", "OPENAI__BASE_URL"),
    )
    llm_api_key: str = Field(default="", validation_alias=AliasChoices("LLM_API_KEY", "OPENAI__API_KEY"))
    llm_model: str = Field(default="", validation_alias=AliasChoices("LLM_MODEL", "OPENAI__MODEL"))
    llm_timeout_seconds: float = 45.0

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
