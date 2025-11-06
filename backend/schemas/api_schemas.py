"""
Pydantic schemas for API request/response validation
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from datetime import datetime


# ============= Emotion Schemas =============

class EmotionAnalysisRequest(BaseModel):
    """Request schema for emotion analysis"""
    text: str = Field(..., min_length=1, max_length=5000, description="Text to analyze")
    session_id: Optional[str] = Field(None, description="Session identifier")
    include_confidence: bool = Field(True, description="Include confidence scores")


class EmotionMetrics(BaseModel):
    """Emotion metrics"""
    nervousness_score: float
    nervousness_level: str
    enthusiasm_score: float
    enthusiasm_level: str
    confidence_score: float
    confidence_level: str
    emotional_stability: float


class EmotionAnalysisResponse(BaseModel):
    """Response schema for emotion analysis"""
    dominant_emotion: str
    emotions: Dict[str, float]
    confidence: float
    metrics: EmotionMetrics
    timestamp: str
    text_length: int
    session_id: Optional[str] = None
    fallback: bool = False
    error: Optional[str] = None


# ============= STT Schemas =============

class STTTranscribeRequest(BaseModel):
    """Request schema for audio transcription"""
    language_code: str = Field("en-US", description="Language code")
    sample_rate: int = Field(16000, description="Sample rate in Hz")
    encoding: str = Field("LINEAR16", description="Audio encoding")


class STTTranscriptionResult(BaseModel):
    """Individual transcription result"""
    transcript: str
    confidence: float


class STTTranscribeResponse(BaseModel):
    """Response schema for transcription"""
    success: bool
    transcript: str
    confidence: float
    language: str
    results: Optional[List[STTTranscriptionResult]] = None
    mock: bool = False
    error: Optional[str] = None


# ============= Chat/LLM Schemas =============

class ChatMessage(BaseModel):
    """Chat message schema"""
    role: str = Field(..., description="Message role: user or assistant")
    content: str = Field(..., description="Message content")
    timestamp: Optional[str] = None


class ChatRequest(BaseModel):
    """Request schema for chat"""
    message: str = Field(..., min_length=1, max_length=5000, description="User message")
    session_id: Optional[str] = Field(None, description="Session identifier")
    conversation_history: Optional[List[ChatMessage]] = Field(None, description="Previous messages")
    include_emotion_analysis: bool = Field(True, description="Include emotion analysis")


class ChatResponse(BaseModel):
    """Response schema for chat"""
    response: str = Field(..., description="AI coach response")
    emotion_analysis: Optional[EmotionAnalysisResponse] = None
    session_id: Optional[str] = None
    timestamp: str


# ============= Combined Pipeline Schemas =============

class PitchAnalysisRequest(BaseModel):
    """Request for complete pitch analysis (STT + Emotion + LLM)"""
    session_id: Optional[str] = None
    language_code: str = "en-US"
    sample_rate: int = 16000
    encoding: str = "LINEAR16"


class PitchAnalysisResponse(BaseModel):
    """Response for complete pitch analysis"""
    transcript: str
    emotion_analysis: EmotionAnalysisResponse
    coach_response: str
    session_id: Optional[str] = None
    timestamp: str


# ============= Health Check Schema =============

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: str
    services: Dict[str, str]
    version: str
