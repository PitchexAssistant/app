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
        openrouter_service = get_openrouter_service()
        context_service = get_context_service()
        
        # Analyze emotion from transcript using OpenRouter
        emotion_data = await openrouter_service.detect_emotion(request.transcript)
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
        
        # Build comprehensive analysis prompt
        analysis_prompt = f"""You are an expert investor and pitch coach. Analyze this recorded pitch presentation.

PITCH TRANSCRIPT:
{request.transcript}

PITCH DURATION: {request.duration} seconds ({request.duration // 60}:{request.duration % 60:02d})

EMOTIONAL TONE: {emotion_data.get('dominant_emotion', 'neutral')} (confidence: {emotion_data.get('confidence', 0):.2f})

{"BUSINESS CONTEXT (from uploaded documents):" if document_context else ""}
{document_context if document_context else "No additional context provided"}

Provide a comprehensive pitch analysis in JSON format with:
1. **summary**: A concise 2-3 sentence overall assessment of the pitch
2. **feedback_items**: An array of 5-7 specific, actionable feedback points
3. **scores**: Scoring metrics (0-100) for:
   - overall: Overall pitch quality
   - clarity: Message clarity and structure
   - confidence: Delivery confidence
   - engagement: Audience engagement potential

Format your response as valid JSON matching this structure:
{{
  "summary": "...",
  "feedback_items": ["...", "...", ...],
  "scores": {{
    "overall": 0-100,
    "clarity": 0-100,
    "confidence": 0-100,
    "engagement": 0-100
  }}
}}

Focus on:
- Problem-solution fit
- Market opportunity
- Value proposition
- Team credibility (if mentioned)
- Financial projections (if mentioned)
- Call to action
- Overall investor appeal

Be constructive, specific, and actionable in your feedback."""
        
        # Generate analysis using OpenRouter
        response_text = await openrouter_service.generate_reasoning_response(
            message=analysis_prompt,
            emotion_data=emotion_data,
            document_context=document_context
        )
        
        logger.info(
            "analysis_generated",
            response_length=len(response_text)
        )
        
        # Parse response (handle both JSON and text responses)
        import json
        import re
        
        try:
            # Try to extract JSON from response
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                analysis_data = json.loads(json_match.group())
            else:
                # Fallback to structured text parsing
                raise ValueError("No JSON found in response")
                
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning("failed_to_parse_json_response", error=str(e))
            
            # Fallback: Structure the text response
            analysis_data = {
                "summary": response_text[:500] if len(response_text) > 500 else response_text,
                "feedback_items": [
                    line.strip()
                    for line in response_text.split('\n')
                    if line.strip() and len(line.strip()) > 20
                ][:7],
                "scores": {
                    "overall": 75,
                    "clarity": 70,
                    "confidence": 80,
                    "engagement": 75
                }
            }
        
        # Ensure all required fields exist
        if "summary" not in analysis_data:
            analysis_data["summary"] = "Your pitch shows promise and demonstrates understanding of your market."
        
        if "feedback_items" not in analysis_data or not analysis_data["feedback_items"]:
            analysis_data["feedback_items"] = [
                "Consider strengthening your problem statement",
                "Add more specific market size data",
                "Emphasize your unique value proposition",
                "Include customer validation examples",
                "Clarify your business model"
            ]
        
        if "scores" not in analysis_data:
            analysis_data["scores"] = {
                "overall": 75,
                "clarity": 70,
                "confidence": 80,
                "engagement": 75
            }
        
        logger.info(
            "analysis_complete",
            session_id=request.session_id,
            feedback_count=len(analysis_data["feedback_items"]),
            overall_score=analysis_data["scores"].get("overall", 0)
        )
        
        return AnalyzePitchResponse(
            summary=analysis_data["summary"],
            feedback_items=analysis_data["feedback_items"],
            scores=analysis_data["scores"],
            emotion_data=emotion_data
        )
        
    except Exception as e:
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
