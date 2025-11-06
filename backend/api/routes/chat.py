"""
Chat API endpoints - Combines STT, Emotion, and LLM
"""

from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
import structlog
from datetime import datetime

from schemas.api_schemas import (
    ChatRequest,
    ChatResponse,
    PitchAnalysisRequest,
    PitchAnalysisResponse
)
from services.emotion_service import get_emotion_service
from services.gemini_service import get_gemini_service
from services.stt_service import get_stt_service

logger = structlog.get_logger()
router = APIRouter()


@router.post("/chat/send", response_model=ChatResponse)
async def send_chat_message(request: ChatRequest, req: Request):
    """
    Send chat message and get AI coach response with emotion analysis
    
    - **message**: User's pitch or question
    - **session_id**: Session identifier for tracking
    - **conversation_history**: Previous conversation messages
    - **include_emotion_analysis**: Whether to analyze emotions
    """
    try:
        emotion_service = req.app.state.emotion_service
        gemini_service = req.app.state.gemini_service
        
        # Analyze emotion if requested
        emotion_analysis = None
        emotion_context = None
        
        if request.include_emotion_analysis:
            emotion_result = emotion_service.analyze(
                text=request.message,
                session_id=request.session_id
            )
            emotion_analysis = emotion_result
            emotion_context = emotion_result
        
        # Generate AI response with emotion context
        ai_response = await gemini_service.generate_response_async(
            user_message=request.message,
            conversation_history=request.conversation_history,
            emotion_context=emotion_context
        )
        
        return ChatResponse(
            response=ai_response,
            emotion_analysis=emotion_analysis,
            session_id=request.session_id,
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error("chat_endpoint_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


@router.post("/chat/analyze-pitch", response_model=PitchAnalysisResponse)
async def analyze_pitch(
    file: UploadFile = File(...),
    session_id: str = Form(None),
    language_code: str = Form("en-US"),
    sample_rate: int = Form(16000),
    encoding: str = Form("LINEAR16"),
    req: Request = None
):
    """
    Complete pitch analysis pipeline: Audio → STT → Emotion → LLM
    
    - **file**: Audio file of the pitch
    - **session_id**: Session identifier
    - **language_code**: Language code (default: en-US)
    - **sample_rate**: Sample rate in Hz
    - **encoding**: Audio encoding
    """
    try:
        stt_service = get_stt_service()
        emotion_service = req.app.state.emotion_service
        gemini_service = req.app.state.gemini_service
        
        # Step 1: Transcribe audio
        audio_content = await file.read()
        
        if len(audio_content) == 0:
            raise HTTPException(status_code=400, detail="Empty audio file")
        
        transcription_result = await stt_service.transcribe_audio_async(
            audio_content=audio_content,
            language_code=language_code,
            sample_rate=sample_rate,
            encoding=encoding
        )
        
        if not transcription_result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=f"Transcription failed: {transcription_result.get('error')}"
            )
        
        transcript = transcription_result.get("transcript", "")
        
        if not transcript:
            raise HTTPException(status_code=400, detail="No speech detected in audio")
        
        # Step 2: Analyze emotion
        emotion_result = emotion_service.analyze(
            text=transcript,
            session_id=session_id
        )
        
        # Step 3: Generate AI coaching response
        ai_response = await gemini_service.generate_response_async(
            user_message=transcript,
            conversation_history=None,
            emotion_context=emotion_result
        )
        
        return PitchAnalysisResponse(
            transcript=transcript,
            emotion_analysis=emotion_result,
            coach_response=ai_response,
            session_id=session_id,
            timestamp=datetime.utcnow().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("pitch_analysis_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Pitch analysis failed: {str(e)}")
