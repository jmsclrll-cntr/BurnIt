from pydantic_settings import BaseSettings
from typing import List
import os

_BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class Settings(BaseSettings):
    SECRET_KEY: str = "burnit-super-secret-key-change-in-production-2026"
    DB_HOST: str = "127.0.0.1"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "burnit_db"
    DATABASE_PATH: str = os.path.join(_BASE_DIR, "burnit.db")
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,https://localhost:5173,https://127.0.0.1:5173"
    MEDIAPIPE_MODEL: str = "lite"  # 'lite' or 'full'
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "burnitadmin2026"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_MINUTES: int = 120
    DATASET_DIR: str = os.path.join(_BASE_DIR, "dataset_records")
    MODEL_DIR: str = os.path.join(_BASE_DIR, "models")

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = os.path.join(_BASE_DIR, ".env")
        env_file_encoding = "utf-8"

settings = Settings()

# Ensure directories are absolute paths anchored to backend directory
if not os.path.isabs(settings.DATASET_DIR):
    settings.DATASET_DIR = os.path.normpath(os.path.join(_BASE_DIR, settings.DATASET_DIR))
if not os.path.isabs(settings.MODEL_DIR):
    settings.MODEL_DIR = os.path.normpath(os.path.join(_BASE_DIR, settings.MODEL_DIR))

os.makedirs(settings.DATASET_DIR, exist_ok=True)
os.makedirs(settings.MODEL_DIR, exist_ok=True)
