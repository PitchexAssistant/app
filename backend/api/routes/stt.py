"""
Speech-to-Text API endpoints
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
import structlog

from schemas.api_schemas import STTTranscribeResponse
from services.stt_service import get_stt_service

logger = structlog.get_logger()
router = APIRouter()


@router.post("/stt/transcribe", response_model=STTTranscribeResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    language_code: str = Form("en-US"),
    sample_rate: int = Form(16000),
    encoding: str = Form("LINEAR16"),
    req: Request = None
):
    """
    Transcribe audio file to text
    
    - **file**: Audio file (WAV, MP3, WEBM, FLAC, OGG)
    - **language_code**: Language code (default: en-US)
    - **sample_rate**: Sample rate in Hz (default: 16000)
    - **encoding**: Audio encoding (LINEAR16, MP3, FLAC, etc.)
    """
    try:
        # Read audio content
        audio_content = await file.read()
        
        if len(audio_content) == 0:
            raise HTTPException(status_code=400, detail="Empty audio file")
        
        # Log file info for debugging
        logger.info(
            "transcribe_request",
            filename=file.filename,
            content_type=file.content_type,
            size=len(audio_content)
        )
        
        # Get STT service
        stt_service = get_stt_service()
        
        # Transcribe
        result = await stt_service.transcribe_audio_async(
            audio_content=audio_content,
            language_code=language_code,
            sample_rate=sample_rate,
            encoding=encoding
        )
        
        return STTTranscribeResponse(**result)
        
    except Exception as e:
        logger.error("transcription_endpoint_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@router.get("/stt/status")
async def stt_status():
    """Check STT service status"""
    stt_service = get_stt_service()
    
    return {
        "status": "operational" if stt_service.client else "mock_mode",
        "has_credentials": stt_service.client is not None
    }
