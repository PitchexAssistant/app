"""
Pitch Analysis Endpoint
Analyzes recorded pitches using OpenRouter with uploaded document context
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
import structlog

from services.openrouter_service import get_openrouter_service
from services.context_service import get_context_service

logger = structlog.get_logger()
router = APIRouter()


class AnalyzePitchRequest(BaseModel):
    """Request model for pitch analysis"""
    session_id: str
    transcript: str
    duration: int  # in seconds


class AnalyzePitchResponse(BaseModel):
    """Response model for pitch analysis"""
    summary: str
    feedback_items: List[str]
    scores: Dict[str, float]
    emotion_data: Optional[Dict] = None


@router.post("/llm/analyze-pitch", response_model=AnalyzePitchResponse)
async def analyze_pitch(request: AnalyzePitchRequest):
    """
    Analyze a recorded pitch with document context
    
    - **session_id**: Session identifier for document context
    - **transcript**: Transcribed pitch text
    - **duration**: Duration of the pitch in seconds
    
    Returns comprehensive analysis including:
    - Overall summary
    - Specific feedback items
    - Scoring metrics
    - Emotion analysis
    """
    try:
        logger.info(
            "analyze_pitch_request",
            session_id=request.session_id,
            transcript_length=len(request.transcript),
            duration=request.duration
        )
        
        # Get services
        from Reasoning import get_reasoning_instance
        from services.emotion_service import get_emotion_service
        
        reasoning_service = get_reasoning_instance()
        emotion_service = get_emotion_service()
        context_service = get_context_service()
        
        # Analyze emotion from transcript using local service
        emotion_data = emotion_service.analyze(request.transcript)
        logger.info(
            "emotion_analyzed",
            dominant_emotion=emotion_data.get('dominant_emotion'),
            confidence=emotion_data.get('confidence')
        )
        
        # Get document context for this session (Reasoning service also handles this via RAG)
        document_context = await context_service.get_session_context(request.session_id)
        
        if document_context:
            logger.info(
                "using_document_context",
                session_id=request.session_id,
                context_length=len(document_context)
            )
        
        # Generate critique using our RAG Reasoning service with specialized template
        logger.info("generating_critique_via_reasoning_service")
        response_text = await reasoning_service.generate_critique(
            user_input=request.transcript,
            session_id=request.session_id
        )
        
        # Parse JSON results from the AI
        import json
        import re
        try:
            # Extract JSON from markdown if necessary
            json_match = re.search(r'(\{[\s\S]*\})', response_text)
            if json_match:
                analysis_data = json.loads(json_match.group(1))
            else:
                analysis_data = json.loads(response_text)
        except Exception as e:
            logger.error("failed_to_parse_analysis_json", error=str(e))
            # Fallback
            analysis_data = {
                "summary": response_text[:300],
                "feedback_items": ["Detailed analysis could not be parsed as JSON, but the raw feedback is available in the summary."],
                "scores": {"overall": 70}
            }

        logger.info(
            "analysis_generated",
            response_length=len(response_text)
        )

        return AnalyzePitchResponse(
            summary=analysis_data.get("summary", ""),
            feedback_items=analysis_data.get("feedback_items", []),
            scores=analysis_data.get("scores", {}),
            emotion_data=emotion_data
        )
        
    except Exception as e:
        error_str = str(e).lower()
        if "quota" in error_str or "rate limit" in error_str or "429" in error_str:
            logger.error("gemini_quota_exceeded", error=str(e))
            raise HTTPException(
                status_code=429,
                detail="AI service is currently at capacity or quota limit reached. Please wait a moment and try again."
            )
            
        logger.error("pitch_analysis_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze pitch: {str(e)}"
        )


@router.get("/llm/status")
async def llm_status():
    """Check LLM service status"""
    try:
        openrouter_service = get_openrouter_service()
        return {
            "status": "operational",
            "reasoning_model": openrouter_service.reasoning_model,
            "emotion_model": openrouter_service.emotion_model,
            "has_reasoning_keys": bool(openrouter_service.reasoning_keys),
            "has_emotion_keys": bool(openrouter_service.emotion_keys)
        }
    except Exception as e:
        logger.error("llm_status_check_failed", error=str(e))
        return {
            "status": "error",
            "error": str(e)
        }
