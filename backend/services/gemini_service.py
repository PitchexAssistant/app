"""
Gemini 2.5 Pro Service for AI Coaching
Uses Google's Gemini API for intelligent pitch coaching responses
"""

import google.generativeai as genai
from typing import List, Dict, Optional
import structlog
from datetime import datetime

from config import settings

logger = structlog.get_logger()


class GeminiService:
    """Service for interacting with Gemini 2.5 Pro LLM"""
    
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = "gemini-2.0-flash-exp"  # Latest Gemini model
        self.model = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize Gemini API"""
        try:
            logger.info("initializing_gemini_model", model=self.model_name)
            
            genai.configure(api_key=self.api_key)
            
            # Configure the model
            generation_config = {
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 2048,
            }
            
            safety_settings = [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ]
            
            self.model = genai.GenerativeModel(
                model_name=self.model_name,
                generation_config=generation_config,
                safety_settings=safety_settings,
                system_instruction=self._get_system_prompt()
            )
            
            logger.info("gemini_model_initialized", model=self.model_name)
            
        except Exception as e:
            logger.error("gemini_initialization_failed", error=str(e))
            raise
    
    def _get_system_prompt(self) -> str:
        """Get the system prompt for the AI coach"""
        return """You are an expert AI Pitch and Negotiation Coach with deep expertise in:
- Business pitching and presentation skills
- Negotiation tactics and strategies
- Emotional intelligence and communication
- Public speaking and confidence building
- Persuasion and influence techniques

Your role is to:
1. Provide constructive, actionable feedback on pitch delivery
2. Analyze communication patterns and suggest improvements
3. Offer emotional support and encouragement
4. Give specific examples and techniques to improve
5. Be empathetic and adapt to the user's emotional state
6. Focus on both content and delivery aspects
7. Help build confidence while maintaining realism

Guidelines:
- Be concise but thorough (200-300 words max)
- Use encouraging language
- Provide 2-3 specific actionable tips
- Reference emotional state when relevant
- Balance praise with constructive criticism
- Use examples to illustrate points
- End with a motivating statement

Remember: Your goal is to help users become better pitchers and negotiators through supportive, expert coaching."""
    
    def generate_response(
        self,
        user_message: str,
        conversation_history: Optional[List[Dict]] = None,
        emotion_context: Optional[Dict] = None
    ) -> str:
        """
        Generate AI coach response
        
        Args:
            user_message: User's input message
            conversation_history: Previous conversation messages
            emotion_context: Emotional analysis of the user's message
            
        Returns:
            AI-generated coaching response
        """
        try:
            # Build the prompt with emotion context
            prompt = self._build_prompt(user_message, emotion_context)
            
            # Start chat with history
            chat = self.model.start_chat(history=self._format_history(conversation_history))
            
            # Generate response
            response = chat.send_message(prompt)
            
            logger.info(
                "gemini_response_generated",
                message_length=len(user_message),
                response_length=len(response.text),
                has_emotion_context=emotion_context is not None
            )
            
            return response.text
            
        except Exception as e:
            logger.error("gemini_generation_failed", error=str(e))
            return self._get_fallback_response(emotion_context)
    
    def _build_prompt(self, user_message: str, emotion_context: Optional[Dict] = None) -> str:
        """Build enhanced prompt with emotion context"""
        
        if not emotion_context:
            return user_message
        
        # Extract emotion data
        dominant = emotion_context.get("dominant_emotion", "neutral")
        confidence = emotion_context.get("confidence", 0)
        metrics = emotion_context.get("metrics", {})
        
        nervousness = metrics.get("nervousness_level", "low")
        enthusiasm = metrics.get("enthusiasm_level", "medium")
        confidence_level = metrics.get("confidence_level", "medium")
        
        # Build emotion-aware prompt
        enhanced_prompt = f"""User's pitch segment:
"{user_message}"

Emotional Analysis:
- Dominant emotion: {dominant} (confidence: {confidence:.2f})
- Enthusiasm level: {enthusiasm}
- Nervousness level: {nervousness}
- Confidence level: {confidence_level}

As their pitch coach, provide feedback that:
1. Acknowledges their current emotional state
2. Addresses any nervousness or anxiety if present
3. Reinforces positive emotions and confidence
4. Suggests emotional and delivery adjustments
5. Provides specific techniques to improve their pitch

Focus on helping them deliver this pitch more effectively."""

        return enhanced_prompt
    
    def _format_history(self, history: Optional[List[Dict]]) -> List[Dict]:
        """Format conversation history for Gemini"""
        if not history:
            return []
        
        formatted = []
        for msg in history[-10:]:  # Keep last 10 messages
            role = "user" if msg.get("role") == "user" else "model"
            formatted.append({
                "role": role,
                "parts": [msg.get("content", "")]
            })
        
        return formatted
    
    def _get_fallback_response(self, emotion_context: Optional[Dict] = None) -> str:
        """Generate fallback response if API fails"""
        
        if emotion_context:
            nervousness = emotion_context.get("metrics", {}).get("nervousness_level", "low")
            
            if nervousness == "high":
                return """I can sense some nervousness in your pitch. That's completely natural! Here are some quick tips:

1. Take a deep breath and slow down your pace
2. Focus on the value you're providing, not your anxiety
3. Remember: the audience wants you to succeed

You've got this! Keep practicing and your confidence will grow."""
            
        return """Thank you for sharing your pitch with me. Here's some general feedback:

1. Focus on clarity: Make sure your main value proposition is crystal clear
2. Show confidence: Speak with conviction about your solution
3. Engage emotionally: Connect with your audience's needs and pain points

Keep practicing! Every pitch makes you stronger."""
    
    async def generate_response_async(
        self,
        user_message: str,
        conversation_history: Optional[List[Dict]] = None,
        emotion_context: Optional[Dict] = None
    ) -> str:
        """Async version of generate_response"""
        # For now, just call the sync version
        # TODO: Implement true async when Gemini SDK supports it
        return self.generate_response(user_message, conversation_history, emotion_context)


# Singleton instance
_gemini_service_instance = None


def get_gemini_service() -> GeminiService:
    """Get singleton instance of GeminiService"""
    global _gemini_service_instance
    if _gemini_service_instance is None:
        _gemini_service_instance = GeminiService()
    return _gemini_service_instance
