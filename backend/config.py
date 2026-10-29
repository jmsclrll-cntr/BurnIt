from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    SECRET_KEY: str = "burnit-super-secret-key-change-in-production-2026"
    DATABASE_PATH: str = "burnit.db"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    MEDIAPIPE_MODEL: str = "lite"  # 'lite' or 'full'
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "burnitadmin2026"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_MINUTES: int = 120
    DATASET_DIR: str = "dataset_records"
    MODEL_DIR: str = "models"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()

os.makedirs(settings.DATASET_DIR, exist_ok=True)
os.makedirs(settings.MODEL_DIR, exist_ok=True)
