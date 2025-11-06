"""
Emotion Analysis API endpoints
"""

from fastapi import APIRouter, HTTPException, Request
import structlog

from schemas.api_schemas import EmotionAnalysisRequest, EmotionAnalysisResponse
from services.emotion_service import get_emotion_service

logger = structlog.get_logger()
router = APIRouter()


@router.post("/emotion/analyze", response_model=EmotionAnalysisResponse)
async def analyze_emotion(request: EmotionAnalysisRequest, req: Request):
    """
    Analyze emotion from text
    
    - **text**: The text to analyze (max 5000 characters)
    - **session_id**: Optional session identifier for tracking
    - **include_confidence**: Whether to include confidence scores
    """
    try:
        emotion_service = req.app.state.emotion_service
        
        result = emotion_service.analyze(
            text=request.text,
            session_id=request.session_id
        )
        
        return EmotionAnalysisResponse(**result)
        
    except Exception as e:
        logger.error("emotion_analysis_endpoint_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Emotion analysis failed: {str(e)}")


@router.post("/emotion/batch")
async def analyze_emotion_batch(texts: list[str], session_id: str = None, req: Request = None):
    """
    Analyze multiple texts in batch
    
    - **texts**: List of texts to analyze
    - **session_id**: Optional session identifier
    """
    try:
        emotion_service = req.app.state.emotion_service
        
        results = emotion_service.analyze_batch(texts, session_id)
        
        return {
            "success": True,
            "count": len(results),
            "results": results
        }
        
    except Exception as e:
        logger.error("batch_emotion_analysis_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Batch analysis failed: {str(e)}")
