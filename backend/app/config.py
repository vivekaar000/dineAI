from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    database_url: str = "sqlite:///./tourist_score.db"
    model_cache_dir: str = "./models"
    cors_origins: str = "http://localhost:3000"
    google_places_api_key: str = "AIzaSyBfih2VmM4atl8KC4iCKY6cfGSLGBoKXCo"

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")

settings = Settings()

