"""
LiveKit Agent Service for Real-Time Voice Pitch Coaching
Handles STT → OpenRouter LLM → TTS pipeline for interactive sessions
"""

import asyncio
import io
import struct
from typing import Optional, List, Dict, AsyncGenerator
import structlog

from services.tts_service import get_tts_service
from services.stt_service import STTService
from services.openrouter_service import get_openrouter_service
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
    - LLM: OpenRouter (openai/gpt-oss-20b:free)
    - TTS: Edge TTS (en-US-GuyNeural)
    """
    
    def __init__(self):
        self.stt_service = STTService()
        self.openrouter_service = get_openrouter_service()
        self.tts_service = get_tts_service()
        self.conversation_history: List[Dict[str, str]] = []
        self.is_processing = False
        
        logger.info("live_pitch_coach_agent_initialized")
    
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
        Generate coach response using OpenRouter LLM
        
        Args:
            user_message: User's transcribed message
            
        Returns:
            Coach's response text
        """
        try:
            logger.info("generating_llm_response", 
                       message_length=len(user_message),
                       history_length=len(self.conversation_history))
            
            # Add user message to history
            self.conversation_history.append({
                "role": "user",
                "content": user_message
            })
            
            # Build messages with system prompt
            messages = [
                {"role": "system", "content": MARCUS_STERLING_PROMPT}
            ] + self.conversation_history[-10:]  # Keep last 10 messages for context
            
            # Use OpenRouter to generate response
            response = await self._call_openrouter(messages)
            
            # Add assistant response to history
            self.conversation_history.append({
                "role": "assistant", 
                "content": response
            })
            
            logger.info("llm_response_generated", response_length=len(response))
            return response
            
        except Exception as e:
            logger.error("llm_generation_error", error=str(e))
            return "I apologize, I'm having trouble processing that. Could you repeat your question about your pitch?"
    
    async def _call_openrouter(self, messages: List[Dict[str, str]]) -> str:
        """
        Call OpenRouter API for response generation
        Uses openai/gpt-oss-20b:free model
        """
        import httpx
        
        api_key = settings.OPENROUTER_API_KEY
        if not api_key:
            raise ValueError("OPENROUTER_API_KEY not configured")
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://pitchex.ai",
            "X-Title": "Pitchex Live Coach"
        }
        
        # Try primary model first, with fallbacks
        models_to_try = [
            "nex-agi/deepseek-v3.1-nex-n1:free",
            "deepseek/deepseek-chat-v3-0324:free",
            "meta-llama/llama-3.3-70b-instruct:free",
            "mistralai/mistral-small-3.1-24b-instruct:free",
        ]
        
        last_error = None
        
        for model in models_to_try:
            try:
                payload = {
                    "model": model,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 300,  # Short responses for real-time
                }
                
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers=headers,
                        json=payload
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        content = data["choices"][0]["message"]["content"]
                        logger.info("openrouter_success", model=model)
                        return content
                    elif response.status_code == 429:
                        logger.warning("openrouter_rate_limited", model=model)
                        last_error = "Rate limited"
                        continue
                    else:
                        last_error = f"HTTP {response.status_code}"
                        logger.warning("openrouter_error", model=model, status=response.status_code)
                        continue
                        
            except Exception as e:
                last_error = str(e)
                logger.error("openrouter_request_failed", model=model, error=str(e))
                continue
        
        raise Exception(f"All models failed: {last_error}")
    
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
    
    async def process_turn(self, audio_data: bytes) -> AsyncGenerator[bytes, None]:
        """
        Complete processing turn: STT → LLM → TTS
        
        Args:
            audio_data: User's audio input
            
        Yields:
            Response audio chunks
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
                return
            
            logger.info("user_said", transcript=transcript[:100])
            
            # Step 2: Generate response
            response = await self.generate_response(transcript)
            
            logger.info("coach_response", response=response[:100])
            
            # Step 3: Synthesize and stream audio
            async for audio_chunk in self.synthesize_speech(response):
                yield audio_chunk
                
        finally:
            self.is_processing = False
    
    def reset_conversation(self):
        """Reset conversation history for new session"""
        self.conversation_history = []
        logger.info("conversation_reset")


# Singleton instance
_agent_instance: Optional[LivePitchCoachAgent] = None


def get_live_pitch_agent() -> LivePitchCoachAgent:
    """Get or create the live pitch coach agent"""
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = LivePitchCoachAgent()
    return _agent_instance
