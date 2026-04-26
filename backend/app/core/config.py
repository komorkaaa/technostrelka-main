from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import computed_field, model_validator

_ROOT_ENV_PATH = Path(__file__).resolve().parents[3] / ".env"

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ROOT_ENV_PATH),
        case_sensitive=False,
        extra="ignore",
    )

    ENV: str = "dev"  # dev | prod
    DEBUG: bool = True

    DATABASE_URL: Optional[str] = None

    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "technostrelkadb"

    SECRET_KEY: str = "change-me"
    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    REDIS_URL: Optional[str] = None
    CORS_ORIGINS: str = ""  # comma-separated list
    AUTH_RATE_LIMIT_PER_MINUTE: int = 60

    @computed_field
    @property
    def database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL

        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @computed_field
    @property
    def cors_origins_list(self) -> list[str]:
        raw = self.CORS_ORIGINS.strip()
        if not raw:
            return []
        return [part.strip() for part in raw.split(",") if part.strip()]

    @model_validator(mode="after")
    def _validate_secrets(self):
        if self.ENV.lower() == "prod" and self.SECRET_KEY in {"change-me", "supersecret"}:
            raise ValueError("SECRET_KEY must be set to a secure value in production")
        return self

@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
