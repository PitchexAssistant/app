"""
Emotion Detection Service using HuggingFace Transformers
Model: j-hartmann/emotion-english-distilroberta-base
Emotions: anger, disgust, fear, joy, neutral, sadness, surprise
"""

from transformers import pipeline
import torch
from typing import Dict, List, Optional
import structlog
from functools import lru_cache
from datetime import datetime

from config import settings

logger = structlog.get_logger()


class EmotionService:
    """Service for detecting emotions from text using transformers"""
    
    def __init__(self):
        self.model_name = settings.EMOTION_MODEL
        self.classifier = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the emotion classification model"""
        try:
            logger.info("initializing_emotion_model", model=self.model_name)
            
            # Use GPU if available, otherwise CPU
            device = 0 if torch.cuda.is_available() else -1
            
            self.classifier = pipeline(
                "text-classification",
                model=self.model_name,
                top_k=None,  # Return all emotion scores
                device=device
            )
            
            logger.info(
                "emotion_model_initialized",
                model=self.model_name,
                device="cuda" if device == 0 else "cpu"
            )
        except Exception as e:
            logger.error("emotion_model_initialization_failed", error=str(e))
            raise
    
    def analyze(self, text: str, session_id: Optional[str] = None) -> Dict:
        """
        Analyze emotion from text
        
        Args:
            text: Input text to analyze
            session_id: Optional session identifier
            
        Returns:
            Dictionary containing emotion analysis results
        """
        if not text or len(text.strip()) < 3:
            return self._get_neutral_result(text)
        
        try:
            # Run emotion classification
            results = self.classifier(text[:512])[0]  # Limit to 512 chars
            
            # Convert to dict
            emotions = {r['label']: round(r['score'], 4) for r in results}
            
            # Get dominant emotion
            dominant_emotion = max(emotions, key=emotions.get)
            confidence = emotions[dominant_emotion]
            
            # Calculate additional metrics
            metrics = self._calculate_metrics(emotions)
            
            result = {
                "dominant_emotion": dominant_emotion,
                "emotions": emotions,
                "confidence": confidence,
                "metrics": metrics,
                "timestamp": datetime.utcnow().isoformat(),
                "text_length": len(text)
            }
            
            if session_id:
                result["session_id"] = session_id
            
            logger.info(
                "emotion_analyzed",
                dominant=dominant_emotion,
                confidence=confidence,
                session_id=session_id
            )
            
            return result
            
        except Exception as e:
            logger.error("emotion_analysis_failed", error=str(e), text_preview=text[:50])
            return self._get_neutral_result(text, error=str(e))
    
    def _calculate_metrics(self, emotions: Dict[str, float]) -> Dict:
        """Calculate additional emotional metrics"""
        
        # Nervousness: combination of fear and sadness
        nervousness_score = emotions.get('fear', 0) + emotions.get('sadness', 0) * 0.5
        
        # Enthusiasm: combination of joy and surprise
        enthusiasm_score = emotions.get('joy', 0) + emotions.get('surprise', 0) * 0.3
        
        # Confidence indicator: neutral + joy - fear - sadness
        confidence_score = (
            emotions.get('neutral', 0) * 0.5 +
            emotions.get('joy', 0) * 0.8 -
            emotions.get('fear', 0) * 0.6 -
            emotions.get('sadness', 0) * 0.4
        )
        
        # Determine levels
        enthusiasm_level = self._get_level(enthusiasm_score, [0.3, 0.5])
        nervousness_level = self._get_level(nervousness_score, [0.3, 0.5])
        confidence_level = self._get_level(confidence_score, [0.3, 0.5])
        
        return {
            "nervousness_score": round(nervousness_score, 4),
            "nervousness_level": nervousness_level,
            "enthusiasm_score": round(enthusiasm_score, 4),
            "enthusiasm_level": enthusiasm_level,
            "confidence_score": round(max(0, confidence_score), 4),
            "confidence_level": confidence_level,
            "emotional_stability": round(1 - self._calculate_variance(emotions), 4)
        }
    
    def _get_level(self, score: float, thresholds: List[float]) -> str:
        """Convert score to level (low/medium/high)"""
        if score < thresholds[0]:
            return "low"
        elif score < thresholds[1]:
            return "medium"
        else:
            return "high"
    
    def _calculate_variance(self, emotions: Dict[str, float]) -> float:
        """Calculate emotional variance (instability)"""
        values = list(emotions.values())
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        return min(variance * 5, 1.0)  # Normalize to 0-1
    
    def _get_neutral_result(self, text: str, error: Optional[str] = None) -> Dict:
        """Return neutral emotion result as fallback"""
        return {
            "dominant_emotion": "neutral",
            "emotions": {
                "anger": 0.0,
                "disgust": 0.0,
                "fear": 0.0,
                "joy": 0.0,
                "neutral": 1.0,
                "sadness": 0.0,
                "surprise": 0.0
            },
            "confidence": 1.0,
            "metrics": {
                "nervousness_score": 0.0,
                "nervousness_level": "low",
                "enthusiasm_score": 0.0,
                "enthusiasm_level": "low",
                "confidence_score": 0.5,
                "confidence_level": "medium",
                "emotional_stability": 1.0
            },
            "timestamp": datetime.utcnow().isoformat(),
            "text_length": len(text),
            "fallback": True,
            "error": error
        }
    
    def analyze_batch(self, texts: List[str], session_id: Optional[str] = None) -> List[Dict]:
        """Analyze multiple texts in batch"""
        return [self.analyze(text, session_id) for text in texts]
    
    def get_emotion_timeline(self, analyses: List[Dict]) -> Dict:
        """Generate emotion timeline from multiple analyses"""
        if not analyses:
            return {"timeline": [], "summary": {}}
        
        timeline = []
        emotion_totals = {
            "anger": 0.0, "disgust": 0.0, "fear": 0.0,
            "joy": 0.0, "neutral": 0.0, "sadness": 0.0, "surprise": 0.0
        }
        
        for analysis in analyses:
            timeline.append({
                "timestamp": analysis.get("timestamp"),
                "dominant": analysis.get("dominant_emotion"),
                "confidence": analysis.get("confidence"),
                "nervousness": analysis.get("metrics", {}).get("nervousness_score", 0)
            })
            
            # Accumulate emotion scores
            for emotion, score in analysis.get("emotions", {}).items():
                if emotion in emotion_totals:
                    emotion_totals[emotion] += score
        
        # Calculate averages
        count = len(analyses)
        emotion_averages = {k: round(v / count, 4) for k, v in emotion_totals.items()}
        
        return {
            "timeline": timeline,
            "summary": {
                "total_analyses": count,
                "emotion_averages": emotion_averages,
                "dominant_overall": max(emotion_averages, key=emotion_averages.get)
            }
        }


# Singleton instance
_emotion_service_instance = None


def get_emotion_service() -> EmotionService:
    """Get singleton instance of EmotionService"""
    global _emotion_service_instance
    if _emotion_service_instance is None:
        _emotion_service_instance = EmotionService()
    return _emotion_service_instance
