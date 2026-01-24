from pydantic_settings import BaseSettings
from functools import lru_cache
class Settings(BaseSettings):
    DATABASE_URL:str = "sqlite:///database.db"
    DEBUG:bool = True
    UNSTRUCTURED_API_KEY:str
    GEMINI_API_KEY:str


    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "forbid"



@lru_cache
def get_settings():
    return Settings()