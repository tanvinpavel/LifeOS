from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    # ─── App ──────────────────────────────────────────────────────────────────
    APP_NAME: str = "LifeOS"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ─── Database ─────────────────────────────────────────────────────────────
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "LifeOS"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"

    @property
    def DATABASE_URL(self) -> str:
        """
        AsyncPG URL — FastAPI async routes এ use হবে।
        Format: postgresql+asyncpg://user:pass@host:port/dbname
        """
        return (
            f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    # ─── JWT ──────────────────────────────────────────────────────────────────
    SECRET_KEY: str = "change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 1 day

    # ─── CORS ─────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        # Docker/production এ environment variable থেকেও নেবে
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """
    Singleton — একবারই load হবে, cache থেকে return করবে।

    Use in FastAPI:
        from app.core.config import get_settings
        settings = get_settings()

    Use as Dependency:
        from fastapi import Depends
        async def route(settings: Settings = Depends(get_settings)):
            ...
    """
    return Settings()