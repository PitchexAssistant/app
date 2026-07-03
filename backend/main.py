from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import structlog

from core.config import settings
from api.routes import stt, llm, emotion, chat, health, live, sessions, analysis, documents, livekit_token, live_pitch
from services.emotion_service import EmotionService
from services.gemini_service import GeminiService
from services.gemini_live_service import GeminiLiveService
from Reasoning import get_reasoning_instance
from services.context_service import get_context_service

# Configure structured logging
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.processors.JSONRenderer()
    ]
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    logger.info("starting_application", environment=settings.ENVIRONMENT)
    
    # Initialize services on startup
    try:
        # Preload emotion model
        emotion_service = EmotionService()
        app.state.emotion_service = emotion_service
        logger.info("emotion_service_initialized")
        
        # Initialize Gemini service
        gemini_service = GeminiService()
        app.state.gemini_service = gemini_service
        logger.info("gemini_service_initialized")
        
        # Initialize Gemini Live service
        gemini_live_service = GeminiLiveService()
        app.state.gemini_live_service = gemini_live_service
        logger.info("gemini_live_service_initialized")

        # Initialize RAG Reasoning service (loads embeddings model)
        logger.info("initializing_reasoning_service")
        reasoning_service = get_reasoning_instance()
        app.state.reasoning_service = reasoning_service
        logger.info("reasoning_service_initialized")

        # Initialize Context service (handles document uploads)
        logger.info("initializing_context_service")
        context_service = get_context_service()
        app.state.context_service = context_service
        logger.info("context_service_initialized")

    except Exception as e:
        logger.error("service_initialization_failed", error=str(e))
        raise
    
    yield

    # Cleanup on shutdown
    logger.info("shutting_down_application")


# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",  # Add support for port 3001
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix=settings.API_V1_PREFIX, tags=["Health"])
app.include_router(stt.router, prefix=settings.API_V1_PREFIX, tags=["Speech-to-Text"])
app.include_router(emotion.router, prefix=settings.API_V1_PREFIX, tags=["Emotion Analysis"])
app.include_router(llm.router, prefix=settings.API_V1_PREFIX, tags=["LLM"])
app.include_router(analysis.router, prefix=settings.API_V1_PREFIX, tags=["Analysis"])  # Pitch analysis
app.include_router(chat.router, prefix=settings.API_V1_PREFIX, tags=["Chat"])
app.include_router(live.router, prefix=settings.API_V1_PREFIX, tags=["Live Coaching"])  # Live sessions
app.include_router(sessions.router, prefix=settings.API_V1_PREFIX, tags=["Sessions"])  # Session management
app.include_router(documents.router, prefix=settings.API_V1_PREFIX, tags=["Documents"])  # Document management
app.include_router(livekit_token.router, prefix=settings.API_V1_PREFIX + "/live", tags=["LiveKit"]) # LiveKit Token
app.include_router(live_pitch.router, prefix=settings.API_V1_PREFIX, tags=["Interactive Pitch"])  # Interactive pitch coaching


@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "running",
        "docs": "/docs" if settings.DEBUG else "disabled"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
