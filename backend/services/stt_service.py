"""
Google Cloud Speech-to-Text Service with Offline Fallback
Handles audio transcription using Google Cloud STT API or offline recognition
"""

from google.cloud import speech
from typing import Optional, BinaryIO
import structlog
from io import BytesIO
import speech_recognition as sr
from pydub import AudioSegment
import tempfile
import os

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
        """
        Offline transcription using SpeechRecognition library
        Converts WebM audio to WAV and uses Google's free Speech Recognition API
        """
        webm_path = None
        wav_path = None
        
        try:
            logger.info("attempting_offline_transcription", audio_size=len(audio_content))
            
            # Save WebM audio to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp_file:
                temp_file.write(audio_content)
                webm_path = temp_file.name
            
            # Convert WebM to WAV using pydub
            logger.info("converting_audio_format", from_format="webm", to_format="wav")
            audio = AudioSegment.from_file(webm_path, format="webm")
            
            # Export as WAV with proper settings for speech recognition
            wav_path = webm_path.replace('.webm', '.wav')
            audio.export(
                wav_path,
                format="wav",
                parameters=["-ac", "1", "-ar", "16000"]  # Mono, 16kHz sample rate
            )
            
            # Initialize recognizer
            recognizer = sr.Recognizer()
            recognizer.energy_threshold = 300
            recognizer.dynamic_energy_threshold = True
            
            # Load the WAV file
            with sr.AudioFile(wav_path) as source:
                # Adjust for ambient noise
                recognizer.adjust_for_ambient_noise(source, duration=0.5)
                audio_data = recognizer.record(source)
            
            # Try Google Speech Recognition (free, no API key needed)
            try:
                transcript = recognizer.recognize_google(audio_data, language='en-US')
                logger.info(
                    "offline_transcription_success",
                    transcript_length=len(transcript),
                    method="google_free_api",
                    transcript=transcript[:100] + "..." if len(transcript) > 100 else transcript
                )
                return {
                    "success": True,
                    "transcript": transcript,
                    "confidence": 0.85,  # Approximate confidence for free API
                    "language": "en-US",
                    "method": "google_free_api",
                    "audio_size": len(audio_content)
                }
            except sr.UnknownValueError:
                logger.warning("offline_transcription_no_speech_detected")
                return {
                    "success": False,
                    "transcript": "",
                    "confidence": 0.0,
                    "language": "en-US",
                    "method": "google_free_api",
                    "error": "Could not understand audio - please speak more clearly or check your microphone"
                }
            except sr.RequestError as e:
                logger.error("offline_transcription_api_error", error=str(e))
                return {
                    "success": False,
                    "transcript": "",
                    "confidence": 0.0,
                    "error": f"Speech recognition service error: {str(e)}. Please check your internet connection."
                }
                    
        except Exception as e:
            logger.error("offline_transcription_failed", error=str(e), error_type=type(e).__name__)
            return {
                "success": False,
                "transcript": "",
                "confidence": 0.0,
                "error": f"Transcription failed: {str(e)}"
            }
        finally:
            # Clean up temporary files
            for path in [webm_path, wav_path]:
                if path and os.path.exists(path):
                    try:
                        os.unlink(path)
                    except Exception as cleanup_error:
                        logger.warning("temp_file_cleanup_failed", path=path, error=str(cleanup_error))
    
    def _generate_mock_transcript(self, audio_content: bytes) -> dict:
        """Generate a mock transcript as last fallback (deprecated)"""
        return {
            "success": True,
            "transcript": "This is a mock transcription for development purposes. Please configure Google Cloud STT for real transcription.",
            "confidence": 0.95,
            "language": "en-US",
            "method": "mock",
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
