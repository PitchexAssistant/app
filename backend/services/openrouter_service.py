"""
OpenRouter LLM Service
Handles interactions with OpenRouter API for recorded session analysis
Supports reasoning LLM and emotion detection with fallback to backup keys
"""

import httpx
import json
import structlog
from typing import Dict, List, Optional
from core.config import settings

logger = structlog.get_logger()


class OpenRouterService:
    """Service for OpenRouter API integration with fallback support"""
    
    def __init__(self):
        """Initialize OpenRouter service with API keys and models"""
        self.base_url = settings.OPENROUTER_BASE_URL
        self.reasoning_model = settings.REASONING_MODEL
        self.emotion_model = settings.EMOTION_DETECTION_MODEL
        
        # API keys with fallback chain
        self.reasoning_keys = [
            settings.REASONING_LLM_API_KEY,
            settings.BACKUP_1_API_KEY
        ]
        self.emotion_keys = [
            settings.EMOTION_DETECTION_LLM_API_KEY,
            settings.BACKUP_2_API_KEY
        ]
        
        # Filter out empty keys
        self.reasoning_keys = [k for k in self.reasoning_keys if k]
        self.emotion_keys = [k for k in self.emotion_keys if k]
        
        if not self.reasoning_keys:
            logger.warning("no_reasoning_api_keys_configured")
        if not self.emotion_keys:
            logger.warning("no_emotion_api_keys_configured")
        
        logger.info(
            "openrouter_service_initialized",
            reasoning_model=self.reasoning_model,
            emotion_model=self.emotion_model,
            reasoning_keys_count=len(self.reasoning_keys),
            emotion_keys_count=len(self.emotion_keys)
        )
    
    async def _make_request(
        self,
        model: str,
        messages: List[Dict[str, str]],
        api_keys: List[str],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        fallback_models: Optional[List[str]] = None
    ) -> str:
        """
        Make request to OpenRouter API with fallback support
        
        Args:
            model: Model identifier
            messages: List of message dicts with role and content
            api_keys: List of API keys to try (in order)
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            fallback_models: Alternative models to try if primary is rate-limited
            
        Returns:
            Generated text response
        """
        if not api_keys:
            raise ValueError("No API keys available")
        
        # Try primary model with all keys first
        models_to_try = [model]
        if fallback_models:
            models_to_try.extend(fallback_models)
        
        last_error = None
        
        for model_idx, current_model in enumerate(models_to_try):
            is_fallback_model = model_idx > 0
            
            if is_fallback_model:
                logger.info(
                    "trying_fallback_model",
                    fallback_model=current_model,
                    reason="primary_model_failed"
                )
            
            for key_idx, api_key in enumerate(api_keys):
                try:
                    logger.info(
                        "attempting_openrouter_request",
                        model=current_model,
                        key_index=key_idx,
                        is_fallback_model=is_fallback_model,
                        is_fallback_key=key_idx > 0
                    )
                    
                    headers = {
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://pitchex.ai",
                        "X-Title": "Pitchex AI Coach"
                    }
                    
                    payload = {
                        "model": current_model,
                        "messages": messages,
                        "temperature": temperature,
                        "max_tokens": max_tokens
                    }
                    
                    async with httpx.AsyncClient(timeout=60.0) as client:
                        response = await client.post(
                            f"{self.base_url}/chat/completions",
                            headers=headers,
                            json=payload
                        )
                        
                        if response.status_code == 200:
                            data = response.json()
                            content = data["choices"][0]["message"]["content"]
                            
                            logger.info(
                                "openrouter_request_successful",
                                model=current_model,
                                key_index=key_idx,
                                response_length=len(content),
                                used_fallback_model=is_fallback_model
                            )
                            
                            return content
                        elif response.status_code == 429:
                            # Rate limited - try next key or model
                            error_msg = f"Rate limited (429) for model {current_model}"
                            logger.warning(
                                "openrouter_rate_limited",
                                model=current_model,
                                key_index=key_idx,
                                will_try_fallback=is_fallback_model or (key_idx < len(api_keys) - 1)
                            )
                            last_error = error_msg
                            # Don't break - try next key with same model first
                            continue
                        else:
                            error_msg = f"HTTP {response.status_code}: {response.text}"
                            logger.warning(
                                "openrouter_request_failed",
                                model=current_model,
                                key_index=key_idx,
                                status_code=response.status_code,
                                error=error_msg
                            )
                            last_error = error_msg
                            
                except Exception as e:
                    logger.error(
                        "openrouter_request_error",
                        model=current_model,
                        key_index=key_idx,
                        error=str(e)
                    )
                    last_error = str(e)
            
            # If we tried all keys for this model and all failed with 429, try next model
            if last_error and "429" in str(last_error) and model_idx < len(models_to_try) - 1:
                logger.info("all_keys_rate_limited_trying_next_model", next_model=models_to_try[model_idx + 1])
                continue
        
        # All models and keys failed
        raise Exception(f"All API keys and models failed. Last error: {last_error}")
    
    async def generate_reasoning_response(
        self,
        message: str,
        emotion_data: Optional[Dict] = None,
        document_context: Optional[str] = None
    ) -> str:
        """
        Generate reasoning/analysis response using OpenRouter
        
        Args:
            message: Analysis prompt
            emotion_data: Optional emotion analysis data
            document_context: Optional document context
            
        Returns:
            Generated analysis text
        """
        try:
            messages = [
                {
                    "role": "system",
                    "content": "You are an expert investor and pitch coach. Provide comprehensive, actionable feedback in valid JSON format."
                },
                {
                    "role": "user",
                    "content": message
                }
            ]
            
            # Fallback models WITHOUT privacy policy issues
            fallback_models = [
                "nvidia/nemotron-nano-12b-v2-vl:free",  # Works reliably
                "cognitivecomputations/dolphin-mistral-24b-venice-edition:free"  # No privacy restrictions
            ]
            
            response = await self._make_request(
                model=self.reasoning_model,
                messages=messages,
                api_keys=self.reasoning_keys,
                temperature=0.7,
                max_tokens=2048,
                fallback_models=fallback_models
            )
            
            return response
            
        except Exception as e:
            logger.error("reasoning_generation_failed", error=str(e))
            raise
    
    async def detect_emotion(self, text: str) -> Dict:
        """
        Detect emotion from text using OpenRouter
        
        Args:
            text: Input text to analyze
            
        Returns:
            Dictionary with emotion analysis
        """
        try:
            prompt = f"""Analyze the emotional tone of the following text and return a JSON object with emotion scores.

Text: "{text}"

Return ONLY a valid JSON object with this exact structure:
{{
  "dominant_emotion": "one of: joy, sadness, anger, fear, surprise, neutral",
  "emotions": {{
    "joy": 0.0-1.0,
    "sadness": 0.0-1.0,
    "anger": 0.0-1.0,
    "fear": 0.0-1.0,
    "surprise": 0.0-1.0,
    "neutral": 0.0-1.0
  }},
  "confidence": 0.0-1.0
}}

All emotion scores should sum to approximately 1.0. Confidence should reflect how certain you are about the dominant emotion."""

            messages = [
                {
                    "role": "system",
                    "content": "You are an emotion analysis expert. Return only valid JSON, no additional text."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
            
            # Fallback model WITHOUT privacy issues
            fallback_models = ["qwen/qwen3-4b:free"]  # Works reliably
            
            response = await self._make_request(
                model=self.emotion_model,
                messages=messages,
                api_keys=self.emotion_keys,
                temperature=0.3,  # Lower temperature for more consistent emotion detection
                max_tokens=500,
                fallback_models=fallback_models
            )
            
            # Parse JSON response
            import re
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                emotion_data = json.loads(json_match.group())
                
                # Validate structure
                if "dominant_emotion" in emotion_data and "emotions" in emotion_data:
                    logger.info(
                        "emotion_detected",
                        dominant=emotion_data.get("dominant_emotion"),
                        confidence=emotion_data.get("confidence", 0)
                    )
                    return emotion_data
            
            # Fallback if parsing fails
            logger.warning("emotion_parsing_failed", response_preview=response[:200])
            return self._get_neutral_emotion()
            
        except Exception as e:
            logger.error("emotion_detection_failed", error=str(e))
            return self._get_neutral_emotion()
    
    def _get_neutral_emotion(self) -> Dict:
        """Return neutral emotion as fallback"""
        return {
            "dominant_emotion": "neutral",
            "emotions": {
                "joy": 0.0,
                "sadness": 0.0,
                "anger": 0.0,
                "fear": 0.0,
                "surprise": 0.0,
                "neutral": 1.0
            },
            "confidence": 1.0
        }


# Global instance
_openrouter_service = None


def get_openrouter_service() -> OpenRouterService:
    """Get or create the global OpenRouter service instance"""
    global _openrouter_service
    if _openrouter_service is None:
        _openrouter_service = OpenRouterService()
    return _openrouter_service
