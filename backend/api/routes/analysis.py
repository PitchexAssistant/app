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
    import json
    import re

    logger.info(
        "analyze_pitch_request",
        session_id=request.session_id,
        transcript_length=len(request.transcript),
        duration=request.duration
    )

    # Get services
    from services.emotion_service import get_emotion_service

    emotion_service = get_emotion_service()
    context_service = get_context_service()

    # Analyze emotion from transcript using local service
    emotion_data = emotion_service.analyze(request.transcript)
    logger.info(
        "emotion_analyzed",
        dominant_emotion=emotion_data.get('dominant_emotion'),
        confidence=emotion_data.get('confidence')
    )

    # Get document context for this session
    document_context = await context_service.get_session_context(request.session_id)

    if document_context:
        logger.info(
            "using_document_context",
            session_id=request.session_id,
            context_length=len(document_context)
        )

    response_text = None
    used_fallback = False

    # Try Gemini first (via Reasoning service)
    try:
        from Reasoning import get_reasoning_instance
        reasoning_service = get_reasoning_instance()

        logger.info("generating_critique_via_gemini")
        response_text = await reasoning_service.generate_critique(
            user_input=request.transcript,
            session_id=request.session_id
        )
        logger.info("gemini_critique_success", response_length=len(response_text))

    except Exception as gemini_error:
        error_str = str(gemini_error).lower()
        logger.warning(
            "gemini_critique_failed",
            error=str(gemini_error),
            will_try_openrouter=True
        )

        # Fallback to OpenRouter if Gemini fails (quota, leaked key, etc.)
        try:
            openrouter_service = get_openrouter_service()

            # Build the critique prompt
            critique_prompt = f"""Analyze the following pitch transcript and provide comprehensive feedback.

Pitch Transcript:
"{request.transcript}"

{f"Context from uploaded documents: {document_context}" if document_context else ""}

Provide your analysis in the following JSON format:
{{
    "summary": "A 2-3 sentence overall assessment of the pitch",
    "feedback_items": [
        "Specific, actionable feedback point 1",
        "Specific, actionable feedback point 2",
        "Specific, actionable feedback point 3",
        "Specific, actionable feedback point 4",
        "Specific, actionable feedback point 5"
    ],
    "scores": {{
        "overall": 0-100,
        "clarity": 0-100,
        "confidence": 0-100,
        "persuasiveness": 0-100,
        "structure": 0-100
    }}
}}

Focus on:
1. Clarity and structure of the pitch
2. Persuasiveness and value proposition
3. Confidence and delivery indicators
4. Areas for improvement
5. Strengths to maintain

Return ONLY valid JSON, no additional text."""

            logger.info("generating_critique_via_openrouter")
            response_text = await openrouter_service.generate_reasoning_response(
                message=critique_prompt,
                emotion_data=emotion_data,
                document_context=document_context
            )
            used_fallback = True
            logger.info("openrouter_critique_success", response_length=len(response_text))

        except Exception as openrouter_error:
            logger.error("openrouter_critique_failed", error=str(openrouter_error))
            raise HTTPException(
                status_code=500,
                detail=f"Failed to analyze pitch: Both Gemini and OpenRouter failed. Please try again later."
            )

    # Parse JSON results from the AI
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
            "summary": response_text[:300] if response_text else "Analysis could not be completed.",
            "feedback_items": ["Detailed analysis could not be parsed as JSON, but the raw feedback is available in the summary."],
            "scores": {"overall": 70}
        }

    logger.info(
        "analysis_complete",
        session_id=request.session_id,
        feedback_count=len(analysis_data.get("feedback_items", [])),
        overall_score=analysis_data.get("scores", {}).get("overall", 0),
        used_fallback=used_fallback
    )

    return AnalyzePitchResponse(
        summary=analysis_data.get("summary", ""),
        feedback_items=analysis_data.get("feedback_items", []),
        scores=analysis_data.get("scores", {}),
        emotion_data=emotion_data
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
