from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import structlog
from Reasoning import Reasoning  # Import your new class

logger = structlog.get_logger()
router = APIRouter()

# Global instance (singleton) to keep memory alive
_reasoning_instance = None

def get_reasoning_instance():
    global _reasoning_instance
    if _reasoning_instance is None:
        _reasoning_instance = Reasoning()
    return _reasoning_instance

class ReasoningRequest(BaseModel):
    transcript: str
    chat_history: Optional[List[str]] = None

class ReasoningResponse(BaseModel):
    response: str

@router.post("/reasoning/analyze", response_model=ReasoningResponse)
async def analyze_reasoning(request: ReasoningRequest):
    """
    Analyze pitch using the advanced Reasoning Model (Gemini + RAG)
    """
    try:
        service = get_reasoning_instance()
        
        logger.info("reasoning_request_received", length=len(request.transcript))
        
        # Call your fast pipeline
        response_text = await service.generate_response(
            user_input=request.transcript
        )
        
        return ReasoningResponse(response=response_text)
        
    except Exception as e:
        logger.error("reasoning_endpoint_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))