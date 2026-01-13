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
    FRONTEND_URL: str = "http://localhost:3001"
    
    # Models
    EMOTION_MODEL: str = "j-hartmann/emotion-english-distilroberta-base"
    EMOTION_CACHE_TTL: int = 14400  # 4 hours
    
    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Pitchex AI Coach"
    VERSION: str = "1.0.0"

    # LiveKit Configuration
    LIVEKIT_URL: str = ""
    LIVEKIT_API_KEY: str = ""
    LIVEKIT_API_SECRET: str = ""
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_LIVE_BACKUP_1: str = ""
    OPENROUTER_LIVE_BACKUP_2: str = ""
    DEEPGRAM_API_KEY: str = ""

    # Additional LLM API Keys (OpenRouter)
    REASONING_LLM_API_KEY: str = ""
    EMOTION_DETECTION_LLM_API_KEY: str = ""
    BACKUP_1_API_KEY: str = ""
    BACKUP_2_API_KEY: str = ""
    
    # OpenRouter Models (for recorded sessions)
    # Using models WITHOUT privacy policy issues (no 404 errors)
    REASONING_MODEL: str = "qwen/qwen3-4b:free"  # Works reliably, no privacy issues
    EMOTION_DETECTION_MODEL: str = "nvidia/nemotron-nano-9b-v2:free"  # Reliable emotion detection
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

    # Tavily API (for web search)
    TAVILY_API_KEY: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
