from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///database.db"
    DEBUG: bool = True
    UNSTRUCTURED_API_KEY: str
    GEMINI_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

@lru_cache
def get_settings():
    return Settings()