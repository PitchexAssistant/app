"""
Gemini Live Service for Real-time Audio Interaction
Handles live pitch coaching sessions with audio streaming
"""

import os
import asyncio
import base64
from typing import Optional, Dict, Any
import structlog
from google import genai
from google.genai import types

logger = structlog.get_logger()


class GeminiLiveService:
    """Service for handling Gemini Live API sessions"""
    
    MODEL = "models/gemini-2.0-flash-exp"
    SEND_SAMPLE_RATE = 16000
    RECEIVE_SAMPLE_RATE = 24000
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize Gemini Live Service"""
        if api_key is None:
            # Try to load from environment
            from dotenv import load_dotenv
            load_dotenv()
            api_key = os.getenv("GEMINI_API_KEY")
        
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        self.client = genai.Client(
            http_options={"api_version": "v1alpha"},
            api_key=api_key
        )
        
        # Marcus Sterling VC Persona for Pitchex
        self.system_instruction = """You are Marcus Sterling, a seasoned venture capital partner with 15 years of experience. 
You've invested in over 50 startups and had 12 successful exits, including 2 unicorns.

Your role in Pitchex is to help entrepreneurs practice and refine their pitches through live, interactive coaching sessions.

**Your Communication Style:**
- Direct and analytical, but encouraging
- Ask probing questions about business fundamentals
- Challenge assumptions constructively
- Provide specific, actionable feedback
- Use investor terminology naturally

**During Live Pitch Sessions:**
1. Listen actively to the entrepreneur's pitch
2. Ask clarifying questions about:
   - Market size and opportunity
   - Customer acquisition strategy
   - Revenue model and unit economics
   - Competitive advantages
   - Team expertise
   - Traction and metrics
   
3. Provide real-time feedback on:
   - Pitch clarity and structure
   - Confidence and delivery
   - Data and evidence strength
   - Key risks and concerns
   
4. Simulate different investor scenarios:
   - PITCH mode: Full presentation with Q&A
   - Q&A mode: Rapid-fire investor questions
   - NEGOTIATION mode: Terms and valuation discussion

**Coaching Focus:**
- Help them articulate their value proposition clearly
- Identify weak points in their pitch
- Build confidence through practice
- Prepare them for real investor meetings

Be supportive but realistic. Your goal is to make them investor-ready."""

        self.sessions: Dict[str, Any] = {}
        logger.info("gemini_live_service_initialized")
    
    def _get_config(self, mode: str = "pitch") -> types.LiveConnectConfig:
        """Get configuration for live session based on mode"""
        
        # Adjust system instruction based on mode
        mode_instructions = {
            "pitch": "\n\nMODE: PITCH PRESENTATION - Listen to their full pitch, then provide feedback and ask 1-2 clarifying questions.",
            "qa": "\n\nMODE: Q&A SESSION - Ask probing investor questions rapid-fire. Focus on: market validation, revenue model, customer acquisition, competition, team, and risks.",
            "negotiation": "\n\nMODE: INVESTMENT NEGOTIATION - Discuss valuation, equity stake, terms, milestones, and use of funds. Be realistic about what investors expect."
        }
        
        system_inst = self.system_instruction + mode_instructions.get(mode, mode_instructions["pitch"])
        
        # System instruction needs to be a Content object with parts
        system_instruction_content = types.Content(
            parts=[types.Part(text=system_inst)],
            role="user"
        )
        
        # Simple config without speech_config for now
        # The API will use default voice settings
        return types.LiveConnectConfig(
            response_modalities=["AUDIO"],
            system_instruction=system_instruction_content
        )
    
    async def create_session(self, session_id: str, mode: str = "pitch", context: Optional[str] = None) -> Dict[str, Any]:
        """Create a new live session"""
        try:
            # Store mode separately, create config on demand
            session_data = {
                "session_id": session_id,
                "mode": mode,
                "context": context,
                "messages": [],
                "active": True
            }
            
            self.sessions[session_id] = session_data
            
            logger.info("live_session_created", session_id=session_id, mode=mode)
            
            return {
                "session_id": session_id,
                "mode": mode,
                "status": "created"
            }
            
        except Exception as e:
            logger.error("session_creation_failed", session_id=session_id, error=str(e))
            raise
    
    async def connect_session(self, session_id: str):
        """Connect to Gemini Live API for a session - returns the async context manager"""
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
        
        session_data = self.sessions[session_id]
        mode = session_data["mode"]
        
        # Create fresh config for this connection
        config = self._get_config(mode)
        
        try:
            # Create live connection context manager
            connection_manager = self.client.aio.live.connect(model=self.MODEL, config=config)
            
            # Enter the context and get the actual session
            session = await connection_manager.__aenter__()
            
            # Store both for cleanup
            session_data["connection_manager"] = connection_manager
            session_data["session"] = session
            
            # Send initial context if provided
            if session_data.get("context"):
                await session.send(
                    input=f"Context: The entrepreneur has uploaded these documents: {session_data['context']}. Please review and keep this in mind during the pitch.",
                    end_of_turn=True
                )
            
            logger.info("live_session_connected", session_id=session_id)
            return session
            
        except Exception as e:
            error_msg = str(e)
            logger.error("session_connection_failed", session_id=session_id, error=error_msg)
            
            # Check for specific error types
            if "quota" in error_msg.lower() or "exceeded" in error_msg.lower():
                raise ValueError("API quota exceeded. Please check your billing details or try again later.")
            elif "401" in error_msg or "unauthorized" in error_msg.lower():
                raise ValueError("API authentication failed. Please check your API key.")
            elif "403" in error_msg or "forbidden" in error_msg.lower():
                raise ValueError("API access forbidden. Please verify your API permissions.")
            else:
                raise ValueError(f"Failed to connect to AI service: {error_msg}")
    
    async def send_audio(self, session_id: str, audio_data: bytes) -> None:
        """Send audio chunk to live session"""
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
        
        session_data = self.sessions[session_id]
        session = session_data.get("session")
        
        if not session:
            raise ValueError(f"Session {session_id} not connected")
        
        try:
            # Send audio as PCM
            await session.send(
                input={
                    "data": audio_data,
                    "mime_type": "audio/pcm"
                }
            )
            
        except Exception as e:
            logger.error("audio_send_failed", session_id=session_id, error=str(e))
            raise
    
    async def send_text(self, session_id: str, text: str, end_of_turn: bool = True) -> None:
        """Send text message to live session"""
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
        
        session_data = self.sessions[session_id]
        session = session_data.get("session")
        
        if not session:
            raise ValueError(f"Session {session_id} not connected")
        
        try:
            await session.send(input=text, end_of_turn=end_of_turn)
            session_data["messages"].append({
                "role": "user",
                "content": text,
                "type": "text"
            })
            
        except Exception as e:
            logger.error("text_send_failed", session_id=session_id, error=str(e))
            raise
    
    async def change_mode(self, session_id: str, new_mode: str) -> Dict[str, Any]:
        """Change session mode (pitch/qa/negotiation)"""
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
        
        session_data = self.sessions[session_id]
        old_mode = session_data["mode"]
        session_data["mode"] = new_mode
        
        # Send mode change instruction
        mode_change_msg = f"Mode changed to {new_mode.upper()}. Adjust your coaching style accordingly."
        await self.send_text(session_id, mode_change_msg, end_of_turn=True)
        
        logger.info("session_mode_changed", session_id=session_id, old_mode=old_mode, new_mode=new_mode)
        
        return {
            "session_id": session_id,
            "old_mode": old_mode,
            "new_mode": new_mode,
            "status": "mode_changed"
        }
    
    async def receive_responses(self, session_id: str):
        """Generator to receive responses from live session"""
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
        
        session_data = self.sessions[session_id]
        session = session_data.get("session")
        
        if not session:
            raise ValueError(f"Session {session_id} not connected")
        
        try:
            # Receive turns from the session - each turn contains multiple responses
            while session_data["active"]:
                turn = session.receive()
                async for response in turn:
                    # Handle different response types
                    if hasattr(response, 'data') and response.data:
                        # Audio response
                        yield {
                            "type": "audio",
                            "data": response.data,
                            "mime_type": "audio/pcm"
                        }
                    
                    if hasattr(response, 'text') and response.text:
                        # Text response (transcription)
                        session_data["messages"].append({
                            "role": "assistant",
                            "content": response.text,
                            "type": "text"
                        })
                        yield {
                            "type": "text",
                            "content": response.text
                        }
                    
                    if hasattr(response, 'server_content') and response.server_content:
                        # Server metadata
                        yield {
                            "type": "metadata",
                            "data": response.server_content
                        }
                    
        except Exception as e:
            logger.error("receive_failed", session_id=session_id, error=str(e))
            raise
    
    async def end_session(self, session_id: str) -> Dict[str, Any]:
        """End a live session and generate summary"""
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
        
        session_data = self.sessions[session_id]
        
        try:
            # Request summary before closing
            summary_prompt = """Based on this pitch practice session, provide a comprehensive summary:

1. **Key Strengths**: What did they do well?
2. **Areas for Improvement**: What needs work?
3. **Critical Feedback**: Most important issues to address
4. **Investor Readiness Score**: 0-100 scale
5. **Next Steps**: Specific actions to take before investor meetings

Be specific and actionable."""

            # This would ideally be sent through the connection before closing
            # For now, we'll mark it for async processing
            
            session_data["active"] = False
            
            # Close connection if exists
            connection_manager = session_data.get("connection_manager")
            if connection_manager:
                try:
                    await connection_manager.__aexit__(None, None, None)
                except:
                    pass
            
            logger.info("live_session_ended", session_id=session_id)
            
            return {
                "session_id": session_id,
                "status": "ended",
                "message_count": len(session_data["messages"]),
                "mode": session_data["mode"]
            }
            
        except Exception as e:
            logger.error("session_end_failed", session_id=session_id, error=str(e))
            raise
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data"""
        return self.sessions.get(session_id)
    
    def cleanup_session(self, session_id: str) -> None:
        """Clean up session data"""
        if session_id in self.sessions:
            del self.sessions[session_id]
            logger.info("session_cleaned_up", session_id=session_id)
