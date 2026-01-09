"""
Edge TTS Service for Text-to-Speech conversion
Uses Microsoft Edge TTS with en-US-GuyNeural voice for Marcus Sterling VC persona
"""

import asyncio
import io
from typing import Optional, AsyncGenerator
import structlog
import edge_tts

logger = structlog.get_logger()


class TTSService:
    """Service for Text-to-Speech using Edge TTS"""
    
    # Voice configuration for Marcus Sterling persona
    DEFAULT_VOICE = "en-US-GuyNeural"
    
    # Voice style options for different coaching scenarios
    STYLES = {
        "neutral": "",
        "friendly": "style='friendly'",
        "cheerful": "style='cheerful'", 
        "hopeful": "style='hopeful'",
        "excited": "style='excited'",
        "serious": "style='sad'",  # For critical feedback
        "emphatic": "style='shouting'",
    }
    
    def __init__(self, voice: str = DEFAULT_VOICE):
        """Initialize TTS Service"""
        self.voice = voice
        logger.info("tts_service_initialized", voice=voice)
    
    async def generate_speech(
        self,
        text: str,
        voice: Optional[str] = None,
        rate: str = "+0%",
        pitch: str = "+0Hz",
        volume: str = "+0%"
    ) -> bytes:
        """
        Generate speech audio from text using Edge TTS
        
        Args:
            text: Text to convert to speech
            voice: Voice to use (default: en-US-GuyNeural)
            rate: Speech rate adjustment (e.g., "+10%", "-5%")
            pitch: Pitch adjustment (e.g., "+5Hz", "-10Hz")
            volume: Volume adjustment (e.g., "+10%", "-5%")
            
        Returns:
            MP3 audio bytes
        """
        if not text or not text.strip():
            logger.warning("tts_empty_text")
            return b""
        
        voice_to_use = voice or self.voice
        
        try:
            logger.info(
                "tts_generating_speech",
                text_length=len(text),
                voice=voice_to_use,
                rate=rate
            )
            
            # Create communicate instance with voice settings
            communicate = edge_tts.Communicate(
                text=text,
                voice=voice_to_use,
                rate=rate,
                pitch=pitch,
                volume=volume
            )
            
            # Collect audio data
            audio_data = io.BytesIO()
            
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data.write(chunk["data"])
            
            audio_bytes = audio_data.getvalue()
            
            logger.info(
                "tts_speech_generated",
                text_length=len(text),
                audio_size=len(audio_bytes)
            )
            
            return audio_bytes
            
        except Exception as e:
            logger.error("tts_generation_failed", error=str(e), text_length=len(text))
            raise
    
    async def generate_speech_stream(
        self,
        text: str,
        voice: Optional[str] = None,
        rate: str = "+0%",
        pitch: str = "+0Hz",
        volume: str = "+0%"
    ) -> AsyncGenerator[bytes, None]:
        """
        Stream speech audio chunks as they are generated
        
        Args:
            text: Text to convert to speech
            voice: Voice to use (default: en-US-GuyNeural)
            rate: Speech rate adjustment
            pitch: Pitch adjustment
            volume: Volume adjustment
            
        Yields:
            MP3 audio chunks
        """
        if not text or not text.strip():
            logger.warning("tts_stream_empty_text")
            return
        
        voice_to_use = voice or self.voice
        
        try:
            logger.info(
                "tts_streaming_speech",
                text_length=len(text),
                voice=voice_to_use
            )
            
            communicate = edge_tts.Communicate(
                text=text,
                voice=voice_to_use,
                rate=rate,
                pitch=pitch,
                volume=volume
            )
            
            chunk_count = 0
            total_bytes = 0
            
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    chunk_count += 1
                    total_bytes += len(chunk["data"])
                    yield chunk["data"]
            
            logger.info(
                "tts_stream_complete",
                chunks=chunk_count,
                total_bytes=total_bytes
            )
            
        except Exception as e:
            logger.error("tts_stream_failed", error=str(e))
            raise
    
    async def generate_ssml_speech(
        self,
        text: str,
        style: str = "friendly",
        rate: str = "medium",
        pitch: str = "medium"
    ) -> bytes:
        """
        Generate speech with SSML for emotional styles
        
        Args:
            text: Text to convert to speech
            style: Emotional style (friendly, cheerful, hopeful, etc.)
            rate: Speech rate (x-slow, slow, medium, fast, x-fast)
            pitch: Pitch level (x-low, low, medium, high, x-high)
            
        Returns:
            MP3 audio bytes
        """
        # Build SSML with express-as for emotional style
        ssml = f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
            xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">
            <voice name="{self.voice}">
                <mstts:express-as style="{style}">
                    <prosody rate="{rate}" pitch="{pitch}">
                        {text}
                    </prosody>
                </mstts:express-as>
            </voice>
        </speak>'''
        
        try:
            logger.info(
                "tts_generating_ssml_speech",
                text_length=len(text),
                style=style
            )
            
            # Edge TTS doesn't support raw SSML directly
            # But we can use the standard rate/pitch parameters
            # and the voice naturally sounds professional
            return await self.generate_speech(
                text=text,
                rate="+5%" if style in ["excited", "cheerful"] else "+0%",
                pitch="+5Hz" if style in ["hopeful", "cheerful"] else "+0Hz"
            )
            
        except Exception as e:
            logger.error("tts_ssml_generation_failed", error=str(e))
            raise


# Singleton instance
_tts_service_instance: Optional[TTSService] = None


def get_tts_service() -> TTSService:
    """Get singleton instance of TTSService"""
    global _tts_service_instance
    if _tts_service_instance is None:
        _tts_service_instance = TTSService()
    return _tts_service_instance


# Convenience function for quick TTS generation
async def text_to_speech(text: str, **kwargs) -> bytes:
    """Quick function to generate speech from text"""
    service = get_tts_service()
    return await service.generate_speech(text, **kwargs)
