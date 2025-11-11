"""
Google Gemini LLM Service
Handles all interactions with Gemini 2.5 Flash for intelligent pitch coaching
Uses advanced prompt engineering templates for business-focused coaching
"""

import google.generativeai as genai
from typing import List, Dict, Optional
import structlog
from config import settings
from services.prompt_templates import PromptTemplates

logger = structlog.get_logger()


class GeminiService:
    """Service for emotion-aware pitch coaching using Gemini LLM"""
    
    def __init__(self):
        """Initialize Gemini service with advanced prompt templates"""
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # Configure generation settings
        generation_config = {
            "temperature": 0.7,  # Balanced creativity and consistency
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 2048,
        }
        
        # Safety settings (permissive for business coaching)
        safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]
        
        self.model = genai.GenerativeModel(
            model_name='gemini-2.0-flash-exp',
            generation_config=generation_config,
            safety_settings=safety_settings
        )
        
        self.prompt_templates = PromptTemplates()
        
        logger.info("initializing_gemini_model", model="gemini-2.0-flash-exp")
        logger.info("gemini_model_initialized", model="gemini-2.0-flash-exp")
    
    async def generate_response(
        self, 
        message: str,
        emotion_data: Optional[Dict] = None,
        conversation_history: Optional[List[Dict]] = None,
        document_context: Optional[str] = None
    ) -> str:
        """
        Generate coaching response using advanced prompt engineering
        
        Args:
            message: User's pitch text
            emotion_data: Emotion analysis results
            conversation_history: Previous conversation messages
            document_context: Context from uploaded business proposals
            
        Returns:
            AI-generated coaching response
        """
        try:
            # Build advanced prompt using templates
            if emotion_data:
                # Use emotion-aware prompting with stage detection
                prompt = self.prompt_templates.build_prompt(
                    transcript=message,
                    emotion_data=emotion_data,
                    conversation_history=conversation_history
                )
                
                # Add document context if available
                if document_context:
                    prompt += f"\n\n=== BUSINESS PROPOSAL CONTEXT ===\n{document_context}\n\n"
                    prompt += "Use the above context from the uploaded business proposals to provide personalized, specific feedback that references actual details from their documents.\n"
                
                detected_stage = self.prompt_templates.detect_pitch_stage(message)
                logger.info(
                    "generating_emotion_aware_response",
                    emotion=emotion_data.get('dominant_emotion'),
                    stage_detected=detected_stage.value,
                    is_business_related=self.prompt_templates.is_business_related(message),
                    has_document_context=document_context is not None
                )
            else:
                # Fallback to basic prompt with business focus
                prompt = f"{PromptTemplates.MASTER_SYSTEM_PROMPT}\n\nUSER: {message}\n\n"
                
                if document_context:
                    prompt += f"\n\n=== BUSINESS PROPOSAL CONTEXT ===\n{document_context}\n\n"
                    prompt += "Use the context from uploaded proposals to give specific feedback.\n\n"
                
                prompt += "Provide pitch coaching feedback."
                logger.info("generating_basic_response", has_document_context=document_context is not None)
            
            # Generate response with Gemini
            response = self.model.generate_content(prompt)
            
            logger.info(
                "response_generated",
                message_length=len(message),
                response_length=len(response.text),
                has_emotion_context=emotion_data is not None,
                has_document_context=document_context is not None
            )
            
            return response.text
            
        except Exception as e:
            logger.error("gemini_generation_error", error=str(e))
            
            # Provide intelligent error response based on emotion
            if emotion_data:
                dominant_emotion = emotion_data.get('dominant_emotion', 'neutral')
                
                if dominant_emotion == 'fear':
                    return """I understand you might be nervous about your pitch. That's completely normal!

Here's what I can tell you: Every successful entrepreneur has felt this way. The key is preparation and practice.

Let's break down your pitch into smaller parts:
1. Start with your problem statement - what are you solving?
2. Then explain your solution clearly
3. Show me why now is the right time

Take a deep breath and try again. I'm here to help you succeed!"""
                
                elif dominant_emotion == 'anger':
                    return """I sense some frustration in your message. Let's channel that energy productively.

Sometimes pitch challenges can be frustrating, but remember:
- Investors want to see problem-solving ability
- Your passion is valuable, but needs to be focused
- Let's work together to make your pitch stronger

What specific part of your pitch would you like to improve?"""
                
                elif dominant_emotion == 'sadness':
                    return """I hear some disappointment in your message. Let me help you reframe this.

Every great entrepreneur faces setbacks. What matters is how you respond:
- Your idea has value, we just need to communicate it better
- Practice makes perfect - pitching is a learnable skill
- Let's identify what's working and build on that

Share more about your business and let's build a winning pitch together!"""
            
            return f"""I encountered a technical issue, but let's keep moving forward!

Could you:
1. Break your pitch into smaller sections (Problem, Solution, Market, Ask)
2. Start with one section at a time
3. Be specific about what feedback you need

I'm here to help you create a compelling pitch. Let's try again!

Technical note: {str(e)}"""
    
    def generate_response_sync(
        self,
        message: str,
        emotion_data: Optional[Dict] = None,
        conversation_history: Optional[List[Dict]] = None
    ) -> str:
        """
        Synchronous version of generate_response for compatibility
        """
        import asyncio
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        return loop.run_until_complete(
            self.generate_response(message, emotion_data, conversation_history)
        )


# Global instance
_gemini_service = None


def get_gemini_service() -> GeminiService:
    """Get or create the global Gemini service instance"""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service
