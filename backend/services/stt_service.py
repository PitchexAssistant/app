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

from core.config import settings
import google.generativeai as genai
import time

logger = structlog.get_logger()


class STTService:
    """Service for Speech-to-Text transcription with multiple providers"""
    
    def __init__(self):
        self.google_cloud_client = None
        self.gemini_model = None
        self._initialize_clients()
    
    def _initialize_clients(self):
        """Initialize STT clients (Gemini + Google Cloud)"""
        # Initialize Gemini for fast STT
        if settings.GEMINI_API_KEY:
            try:
                logger.info("initializing_gemini_stt")
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.gemini_model = genai.GenerativeModel('gemini-2.0-flash-exp')
                logger.info("gemini_stt_initialized")
            except Exception as e:
                logger.warning("gemini_stt_initialization_failed", error=str(e))
        else:
            logger.warning("gemini_api_key_missing_skipping_gemini_stt")
        
        # Initialize Google Cloud STT as fallback
        # Only attempt if GOOGLE_APPLICATION_CREDENTIALS is set to avoid long blocks
        if os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
            try:
                logger.info("initializing_google_cloud_stt")
                self.google_cloud_client = speech.SpeechClient()
                logger.info("google_cloud_stt_initialized")
            except Exception as e:
                logger.warning("google_cloud_stt_initialization_failed", error=str(e))
        else:
            logger.info("google_application_credentials_missing_skipping_google_cloud_stt")
    
    def transcribe_audio(
        self,
        audio_content: bytes,
        language_code: str = "en-US",
        sample_rate: int = 16000,
        encoding: str = "LINEAR16"
    ) -> dict:
        """
        Transcribe audio content to text using fastest available method
        Priority: Google Free API (most reliable) → Gemini STT → Google Cloud STT
        
        Args:
            audio_content: Audio file content as bytes
            language_code: Language code (default: en-US)
            sample_rate: Audio sample rate in Hz
            encoding: Audio encoding format
            
        Returns:
            Dictionary with transcription results
        """
        start_time = time.time()
        
        # Try Google Free API FIRST (most reliable, no credentials needed)
        logger.info("attempting_google_free_api_stt", audio_size=len(audio_content))
        result = self._google_free_api_transcription(audio_content)
        
        if result.get("success"):
            elapsed = time.time() - start_time
            result["elapsed_ms"] = int(elapsed * 1000)
            logger.info(
                "google_free_api_stt_success",
                transcript_length=len(result.get("transcript", "")),
                elapsed_ms=result["elapsed_ms"]
            )
            return result
        
        # Fallback 1: Try Gemini STT if available
        if self.gemini_model:
            try:
                logger.info("attempting_gemini_stt_fallback", audio_size=len(audio_content))
                
                # Upload audio to Gemini
                import tempfile
                with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
                    temp_file.write(audio_content)
                    temp_path = temp_file.name
                
                try:
                    # Upload file to Gemini
                    audio_file = genai.upload_file(temp_path)
                    
                    # Generate transcription
                    prompt = "Transcribe this audio exactly as spoken. Return only the transcription text, no additional commentary."
                    response = self.gemini_model.generate_content([prompt, audio_file])
                    transcript = response.text.strip()
                    
                    elapsed = time.time() - start_time
                    logger.info(
                        "gemini_stt_success",
                        transcript_length=len(transcript),
                        elapsed_ms=int(elapsed * 1000)
                    )
                    
                    return {
                        "success": True,
                        "transcript": transcript,
                        "confidence": 0.90,  # Gemini is highly accurate
                        "language": language_code,
                        "method": "gemini_stt",
                        "elapsed_ms": int(elapsed * 1000)
                    }
                finally:
                    # Clean up temp file
                    if os.path.exists(temp_path):
                        os.unlink(temp_path)
                        
            except Exception as e:
                logger.warning("gemini_stt_failed", error=str(e))
                # Fall through to Google Cloud STT
        
        # Fallback 2: Try Google Cloud STT (requires credentials)
        if self.google_cloud_client:
            try:
                logger.info("attempting_google_cloud_stt_fallback")
                
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
                response = self.google_cloud_client.recognize(config=config, audio=audio)
                
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
                
                elapsed = time.time() - start_time
                logger.info(
                    "google_cloud_stt_success",
                    transcript_length=len(full_transcript),
                    confidence=avg_confidence,
                    num_results=len(transcripts),
                    elapsed_ms=int(elapsed * 1000)
                )
                
                return {
                    "success": True,
                    "transcript": full_transcript,
                    "confidence": avg_confidence,
                    "language": language_code,
                    "method": "google_cloud_stt",
                    "results": transcripts,
                    "elapsed_ms": int(elapsed * 1000)
                }
                
            except Exception as e:
                logger.warning("google_cloud_stt_failed", error=str(e))
        
        # All methods failed - return the Google Free API result even if it failed
        logger.error("all_stt_methods_failed")
        return result
    
    def _google_free_api_transcription(self, audio_content: bytes) -> dict:
        """
        Offline transcription using SpeechRecognition library
        Supports WebM, MP3, WAV formats and uses Google's free Speech Recognition API
        """
        input_path = None
        wav_path = None
        
        try:
            logger.info("attempting_offline_transcription", audio_size=len(audio_content))
            
            # Detect audio format from content
            audio_format = 'webm'  # default
            if audio_content[:4] == b'RIFF':
                audio_format = 'wav'
            elif audio_content[:3] == b'ID3' or audio_content[:2] == b'\xff\xfb' or audio_content[:2] == b'\xff\xf3':
                audio_format = 'mp3'
            
            # Save audio to temporary file with appropriate extension
            suffix = f'.{audio_format}'
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
                temp_file.write(audio_content)
                input_path = temp_file.name
            
            # Convert to WAV using pydub
            logger.info("converting_audio_format", from_format=audio_format, to_format="wav")
            audio = AudioSegment.from_file(input_path, format=audio_format)
            
            # Export as WAV with proper settings for speech recognition
            wav_path = input_path.replace(suffix, '.wav')
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
                    "language": "en-US",
                    "error": f"Speech recognition service error: {str(e)}. Please check your internet connection."
                }
                    
        except Exception as e:
            logger.error("offline_transcription_failed", error=str(e), error_type=type(e).__name__)
            return {
                "success": False,
                "transcript": "",
                "confidence": 0.0,
                "language": "en-US",
                "error": f"Transcription failed: {str(e)}"
            }
        finally:
            # Clean up temporary files
            for path in [input_path, wav_path]:
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
