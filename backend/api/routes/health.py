"""
Health check endpoint
"""

from fastapi import APIRouter
from datetime import datetime

from core.config import settings
from schemas.api_schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        services={
            "emotion_detection": "operational",
            "gemini_llm": "operational",
            "stt": "operational"
        },
        version=settings.VERSION
    )
