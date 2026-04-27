from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import computed_field, model_validator

_THIS_FILE = Path(__file__).resolve()
# The python package root (../app). In Docker this is usually `/app/app` and is writable
# by the non-root `app` user (we `chown` it in the Dockerfile).
_APP_DIR = _THIS_FILE.parents[1]

def _find_env_path() -> Path:
    for parent in _THIS_FILE.parents:
        candidate = parent / ".env"
        if candidate.exists():
            return candidate
    # Fallback (used mainly when running in containers where .env isn't copied).
    return _THIS_FILE.parents[3] / ".env"

_ROOT_ENV_PATH = _find_env_path()

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
    MEDIA_DIR: str = "uploads"
    QUEST_COVER_MAX_BYTES: int = 5 * 1024 * 1024
    CODEWORD_MAX_ATTEMPTS: int = 5

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

    @computed_field
    @property
    def media_dir_path(self) -> str:
        p = Path(self.MEDIA_DIR)
        if not p.is_absolute():
            p = _APP_DIR / p
        return str(p)

    @model_validator(mode="after")
    def _validate_secrets(self):
        if self.ENV.lower() == "prod" and self.SECRET_KEY in {"change-me", "supersecret"}:
            raise ValueError("SECRET_KEY must be set to a secure value in production")
        return self

@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
