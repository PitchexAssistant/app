"""
Google Cloud Speech-to-Text Service
Handles audio transcription using Google Cloud STT API
"""

from google.cloud import speech
from typing import Optional, BinaryIO
import structlog
from io import BytesIO

from config import settings

logger = structlog.get_logger()


class STTService:
    """Service for Speech-to-Text transcription"""
    
    def __init__(self):
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Google Cloud Speech client"""
        try:
            logger.info("initializing_stt_client")
            self.client = speech.SpeechClient()
            logger.info("stt_client_initialized")
        except Exception as e:
            logger.error("stt_initialization_failed", error=str(e))
            # For development without Google Cloud credentials
            logger.warning("running_without_google_cloud_stt")
    
    def transcribe_audio(
        self,
        audio_content: bytes,
        language_code: str = "en-US",
        sample_rate: int = 16000,
        encoding: str = "LINEAR16"
    ) -> dict:
        """
        Transcribe audio content to text
        
        Args:
            audio_content: Audio file content as bytes
            language_code: Language code (default: en-US)
            sample_rate: Audio sample rate in Hz
            encoding: Audio encoding format
            
        Returns:
            Dictionary with transcription results
        """
        
        if not self.client:
            logger.warning("stt_client_not_available_using_mock")
            return self._mock_transcription(audio_content)
        
        try:
            # Configure audio
            audio = speech.RecognitionAudio(content=audio_content)
            
            # Configure recognition
            encoding_map = {
                "LINEAR16": speech.RecognitionConfig.AudioEncoding.LINEAR16,
                "MP3": speech.RecognitionConfig.AudioEncoding.MP3,
                "FLAC": speech.RecognitionConfig.AudioEncoding.FLAC,
                "WAV": speech.RecognitionConfig.AudioEncoding.LINEAR16,
                "OGG_OPUS": speech.RecognitionConfig.AudioEncoding.OGG_OPUS,
                "WEBM_OPUS": speech.RecognitionConfig.AudioEncoding.WEBM_OPUS
            }
            
            config = speech.RecognitionConfig(
                encoding=encoding_map.get(encoding.upper(), speech.RecognitionConfig.AudioEncoding.LINEAR16),
                sample_rate_hertz=sample_rate,
                language_code=language_code,
                enable_automatic_punctuation=True,
                enable_word_time_offsets=False,
                model="default"
            )
            
            # Perform transcription
            response = self.client.recognize(config=config, audio=audio)
            
            # Process results
            transcripts = []
            for result in response.results:
                alternative = result.alternatives[0]
                transcripts.append({
                    "transcript": alternative.transcript,
                    "confidence": alternative.confidence
                })
            
            # Combine transcripts
            full_transcript = " ".join([t["transcript"] for t in transcripts])
            avg_confidence = sum([t["confidence"] for t in transcripts]) / len(transcripts) if transcripts else 0
            
            logger.info(
                "audio_transcribed",
                transcript_length=len(full_transcript),
                confidence=avg_confidence,
                num_results=len(transcripts)
            )
            
            return {
                "success": True,
                "transcript": full_transcript,
                "confidence": avg_confidence,
                "language": language_code,
                "results": transcripts
            }
            
        except Exception as e:
            logger.error("transcription_failed", error=str(e))
            return {
                "success": False,
                "error": str(e),
                "transcript": "",
                "confidence": 0.0
            }
    
    def _mock_transcription(self, audio_content: bytes) -> dict:
        """Mock transcription for development without Google Cloud"""
        return {
            "success": True,
            "transcript": "This is a mock transcription for development purposes.",
            "confidence": 0.95,
            "language": "en-US",
            "mock": True,
            "audio_size": len(audio_content)
        }
    
    async def transcribe_audio_async(
        self,
        audio_content: bytes,
        language_code: str = "en-US",
        sample_rate: int = 16000,
        encoding: str = "LINEAR16"
    ) -> dict:
        """Async version of transcribe_audio"""
        # For now, call sync version
        # TODO: Implement true async when needed
        return self.transcribe_audio(audio_content, language_code, sample_rate, encoding)


# Singleton instance
_stt_service_instance = None


def get_stt_service() -> STTService:
    """Get singleton instance of STTService"""
    global _stt_service_instance
    if _stt_service_instance is None:
        _stt_service_instance = STTService()
    return _stt_service_instance
