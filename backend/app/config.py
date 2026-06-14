from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    fastapi_env: str = "development"
    database_url: str = "postgresql://user:password@localhost:5432/tamil_coach"

    jwt_secret: str = "changeme"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 1
    jwt_refresh_expiry_days: int = 30

    google_cloud_project_id: str = ""
    google_application_credentials: str = ""

    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"
    gemini_endpoint: str = "https://generativelanguage.googleapis.com/v1beta/models"

    google_stt_model: str = "latest"
    google_stt_endpoint: str = "speech.googleapis.com"

    google_tts_model: str = "neural"
    google_tts_endpoint: str = "texttospeech.googleapis.com"

    supabase_url: str = ""
    supabase_key: str = ""

    admin_default_username: str = "admin"
    admin_default_password: str = "admin"

    enable_cost_tracking: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
