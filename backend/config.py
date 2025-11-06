from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # API Keys
    GEMINI_API_KEY: str
    HUGGINGFACE_API_KEY: str = ""
    HF_TOKEN: str = ""
    
    # Google Cloud
    GOOGLE_CLOUD_PROJECT: str = ""
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./pitchex.db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Models
    EMOTION_MODEL: str = "j-hartmann/emotion-english-distilroberta-base"
    EMOTION_CACHE_TTL: int = 14400  # 4 hours
    
    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Pitchex AI Coach"
    VERSION: str = "1.0.0"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
