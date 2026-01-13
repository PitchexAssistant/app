"""
LiveKit Agent Service for Real-Time Voice Pitch Coaching
Handles STT → OpenRouter LLM → TTS pipeline for interactive sessions
"""

import asyncio
import io
import struct
from typing import Optional, List, Dict, AsyncGenerator, Union
import structlog

from services.tts_service import get_tts_service
from services.stt_service import get_stt_service
from services.emotion_service import get_emotion_service
from Reasoning import get_reasoning_instance
from core.config import settings

logger = structlog.get_logger()

# Marcus Sterling VC Persona System Prompt
MARCUS_STERLING_PROMPT = """You are Marcus Sterling, a seasoned venture capitalist with 15+ years of experience evaluating startups.

PERSONALITY:
- Direct but encouraging
- Focus on providing actionable, specific feedback
- Challenge weak assumptions constructively
- Celebrate strengths when you see them
- Professional yet approachable tone

SCOPE - CRITICAL:
- You ONLY discuss topics related to: pitches, startups, business models, funding, investors, market analysis, team building, product-market fit, go-to-market strategies, financial projections
- If the user asks about ANYTHING unrelated (weather, sports, general chat, personal questions), politely but firmly redirect:
  "I appreciate the question, but let's focus on your pitch. What aspect of your startup would you like feedback on?"

RESPONSE STYLE:
- Keep responses SHORT and conversational (1-3 sentences typically)
- Ask clarifying questions to understand their business better
- Give specific, actionable feedback
- Use investor terminology naturally
- Be the tough-but-fair VC they need

EXAMPLES:
- User: "We're a B2B SaaS targeting SMBs"
  You: "Interesting space. What's your current ARR and customer acquisition cost? Those metrics are critical for Series A conversations."

- User: "What's the weather like?"
  You: "Let's stay focused on your pitch. Tell me about your target market - who's your ideal customer?"

Remember: You're here to help them refine their pitch and prepare for real investor meetings."""


class LivePitchCoachAgent:
    """
    Real-time voice pitch coaching agent using:
    - STT: Google Free API / Gemini fallback
    - LLM: RAG Reasoning (Gemini 2.5 Flash + FAISS + Tavily)
    - TTS: Edge TTS (en-US-GuyNeural)
    """

    def __init__(self, session_id: str = "default"):
        self.session_id = session_id
        self.stt_service = get_stt_service()
        self.reasoning_service = get_reasoning_instance()
        self.tts_service = get_tts_service()
        self.emotion_service = get_emotion_service()
        self.is_processing = False

        logger.info("live_pitch_coach_agent_initialized", session_id=session_id)
    
    async def process_audio_input(self, audio_data: bytes, sample_rate: int = 16000) -> Optional[str]:
        """
        Transcribe audio input to text using STT
        
        Args:
            audio_data: Raw PCM audio bytes
            sample_rate: Audio sample rate
            
        Returns:
            Transcribed text or None if failed
        """
        try:
            logger.info("processing_audio_input", audio_size=len(audio_data))
            
            # Use existing STT service
            result = self.stt_service.transcribe_audio(
                audio_content=audio_data,
                sample_rate=sample_rate
            )
            
            if result.get("success") and result.get("transcript"):
                transcript = result["transcript"].strip()
                logger.info("stt_transcription_success", 
                           transcript_length=len(transcript),
                           elapsed_ms=result.get("elapsed_ms", 0))
                return transcript
            
            logger.warning("stt_transcription_empty", result=result)
            return None
            
        except Exception as e:
            logger.error("stt_transcription_error", error=str(e))
            return None
    
    async def generate_response(self, user_message: str) -> str:
        """
        Generate coach response using RAG Reasoning model

        Args:
            user_message: User's transcribed message

        Returns:
            Coach's response text
        """
        try:
            logger.info("generating_reasoning_response",
                       message_length=len(user_message),
                       session_id=self.session_id)

            # Use RAG Reasoning service with session-specific memory
            response = await self.reasoning_service.generate_response(
                user_input=user_message,
                session_id=self.session_id
            )

            logger.info("reasoning_response_generated",
                       response_length=len(response),
                       session_id=self.session_id)
            return response

        except Exception as e:
            logger.error("reasoning_generation_error", error=str(e), session_id=self.session_id)
            return "I apologize, I'm having trouble processing that. Could you repeat your question about your pitch?"
    
    async def synthesize_speech(self, text: str) -> AsyncGenerator[bytes, None]:
        """
        Convert text to speech using Edge TTS
        
        Args:
            text: Text to synthesize
            
        Yields:
            MP3 audio chunks
        """
        try:
            logger.info("synthesizing_speech", text_length=len(text))
            
            async for chunk in self.tts_service.generate_speech_stream(
                text=text,
                rate="+5%"  # Slightly faster for natural feel
            ):
                yield chunk
                
            logger.info("speech_synthesis_complete")
            
        except Exception as e:
            logger.error("speech_synthesis_error", error=str(e))
            raise
    
    async def process_turn(self, audio_data: bytes) -> AsyncGenerator[Union[bytes, Dict], None]:
        """
        Complete processing turn: STT → Emotion → LLM → TTS
        
        Args:
            audio_data: User's audio input
            
        Yields:
            Response audio chunks AND emotion data AND transcription/response text
        """
        if self.is_processing:
            logger.warning("already_processing_skipping")
            return
        
        self.is_processing = True
        
        try:
            # Step 1: Transcribe audio
            transcript = await self.process_audio_input(audio_data)
            
            if not transcript:
                logger.info("no_transcript_skipping")
                yield {"type": "no_speech"}
                return
            
            logger.info("user_said", transcript=transcript[:100])
            
            # Step 1.5: Send transcription to frontend immediately
            yield {"type": "transcription", "text": transcript}
            
            # Step 2: Analyze Emotion (Fast, Local)
            # Run immediately so frontend gets it while waiting for LLM
            emotion_result = self.emotion_service.analyze(transcript)
            yield {"type": "emotion", "data": emotion_result}
            
            # Step 3: Generate response
            response = await self.generate_response(transcript)
            
            logger.info("coach_response", response=response[:100])
            
            # Step 3.5: Send response text to frontend before audio
            yield {"type": "response", "text": response}
            
            # Step 4: Synthesize and stream audio
            async for audio_chunk in self.synthesize_speech(response):
                yield audio_chunk
                
        finally:
            self.is_processing = False
                

    
    def reset_conversation(self):
        """Reset conversation history for this session"""
        self.reasoning_service.clear_session(self.session_id)
        logger.info("conversation_reset", session_id=self.session_id)

    def save_conversation_history(self) -> List[Dict[str, str]]:
        """Get conversation history for persistence"""
        return self.reasoning_service.save_memory_to_dict(self.session_id)

    def load_conversation_history(self, history: List[Dict[str, str]]):
        """Restore conversation history from storage"""
        if history:
            self.reasoning_service.load_memory_from_dict(self.session_id, history)
            logger.info("loaded_conversation_history", session_id=self.session_id, count=len(history))


# Session-based agent instances
_agent_instances: dict[str, LivePitchCoachAgent] = {}


def get_live_pitch_agent(session_id: str = "default") -> LivePitchCoachAgent:
    """Get or create the live pitch coach agent for a session"""
    global _agent_instances
    if session_id not in _agent_instances:
        _agent_instances[session_id] = LivePitchCoachAgent(session_id)
    return _agent_instances[session_id]


def cleanup_agent(session_id: str):
    """Clean up agent instance when session ends"""
    global _agent_instances
    if session_id in _agent_instances:
        _agent_instances[session_id].reset_conversation()
        del _agent_instances[session_id]
        logger.info("agent_cleaned_up", session_id=session_id)
