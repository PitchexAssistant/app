"""
LLM (Gemini) API endpoints
"""

from fastapi import APIRouter, HTTPException, Request
import structlog
from pydantic import BaseModel

from services.gemini_service import get_gemini_service

logger = structlog.get_logger()
router = APIRouter()


class LLMRequest(BaseModel):
    message: str
    conversation_history: list = None


class LLMResponse(BaseModel):
    response: str


@router.post("/llm/generate", response_model=LLMResponse)
async def generate_response(request: LLMRequest, req: Request):
    """
    Generate LLM response
    
    - **message**: User message
    - **conversation_history**: Optional conversation history
    """
    try:
        gemini_service = req.app.state.gemini_service
        
        response = await gemini_service.generate_response_async(
            user_message=request.message,
            conversation_history=request.conversation_history
        )
        
        return LLMResponse(response=response)
        
    except Exception as e:
        logger.error("llm_generation_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"LLM generation failed: {str(e)}")


@router.get("/llm/status")
async def llm_status(req: Request):
    """Check LLM service status"""
    
    return {
        "status": "operational",
        "model": "gemini-2.0-flash-exp"
    }
