"""
WebSocket endpoint for Interactive Live Pitch Coaching
Uses STT → OpenRouter LLM → TTS pipeline for real-time voice interaction
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Optional
import json
import asyncio
import base64
import structlog

from services.livekit_agent import get_live_pitch_agent

logger = structlog.get_logger()
router = APIRouter()


class LiveSessionManager:
    """Manages WebSocket connections for live pitch sessions"""
    
    def __init__(self):
        self.active_sessions: dict[str, WebSocket] = {}
        self.audio_buffers: dict[str, bytearray] = {}
        self.is_speaking: dict[str, bool] = {}
        self.active_tasks: dict[str, set[asyncio.Task]] = {}
    
    async def connect(self, session_id: str, websocket: WebSocket):
        """Accept and store WebSocket connection"""
        await websocket.accept()
        self.active_sessions[session_id] = websocket
        self.audio_buffers[session_id] = bytearray()
        self.is_speaking[session_id] = False
        self.active_tasks[session_id] = set()
        logger.info("live_session_connected", session_id=session_id)
    
    def disconnect(self, session_id: str):
        """Remove WebSocket connection and cleanup"""
        # Cancel all pending tasks for this session
        if session_id in self.active_tasks:
            for task in self.active_tasks[session_id]:
                if not task.done():
                    task.cancel()
            del self.active_tasks[session_id]

        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
        if session_id in self.audio_buffers:
            del self.audio_buffers[session_id]
        if session_id in self.is_speaking:
            del self.is_speaking[session_id]
        logger.info("live_session_disconnected", session_id=session_id)
    
    def add_task(self, session_id: str, task: asyncio.Task):
        """Track async task for cleanup"""
        if session_id in self.active_tasks:
            self.active_tasks[session_id].add(task)
            task.add_done_callback(lambda t: self.active_tasks[session_id].discard(t) if session_id in self.active_tasks else None)

    async def send_json(self, session_id: str, message: dict):
        """Send JSON message to session"""
        if session_id in self.active_sessions:
            try:
                await self.active_sessions[session_id].send_json(message)
            except Exception:
                # Connection might be closed
                pass
    
    async def send_audio(self, session_id: str, audio_data: bytes):
        """Send audio data to session"""
        if session_id in self.active_sessions:
            try:
                await self.active_sessions[session_id].send_bytes(audio_data)
            except Exception:
                pass


session_manager = LiveSessionManager()


@router.websocket("/ws/pitch/{session_id}")
async def interactive_pitch_session(
    websocket: WebSocket,
    session_id: str,
    context: Optional[str] = Query(default=None)
):
    """
    Interactive pitch coaching WebSocket endpoint
    
    Message format:
    - Binary: Raw PCM audio data (16kHz, mono, 16-bit)
    - JSON: Control messages
    
    Control messages:
    - {"type": "start_speaking"}: User started speaking
    - {"type": "stop_speaking"}: User stopped speaking, process audio
    - {"type": "text", "content": "..."}: Text input
    - {"type": "reset"}: Reset conversation
    - {"type": "ping"}: Keep-alive ping
    
    Response messages:
    - {"type": "transcription", "text": "..."}: User's speech transcription
    - {"type": "response", "text": "..."}: Coach's text response
    - {"type": "speaking_start"}: Coach started speaking
    - {"type": "speaking_end"}: Coach stopped speaking
    - Binary: MP3 audio response
    """
    await session_manager.connect(session_id, websocket)
    agent = get_live_pitch_agent()
    
    # Reset conversation for new session
    agent.reset_conversation()
    
    # Send welcome message
    await session_manager.send_json(session_id, {
        "type": "connected",
        "message": "Connected to pitch coach. Start speaking to begin."
    })
    
    try:
        while True:
            message = await websocket.receive()
            
            if "bytes" in message:
                # Audio data received - append to buffer
                audio_data = message["bytes"]
                session_manager.audio_buffers[session_id].extend(audio_data)
                
            elif "text" in message:
                # Control message received
                try:
                    data = json.loads(message["text"])
                    msg_type = data.get("type")
                    
                    if msg_type == "ping":
                        await session_manager.send_json(session_id, {"type": "pong"})
                        
                    elif msg_type == "start_speaking":
                        # User started speaking - clear buffer
                        session_manager.audio_buffers[session_id] = bytearray()
                        session_manager.is_speaking[session_id] = True
                        
                    elif msg_type == "stop_speaking":
                        # User stopped speaking - process buffered audio
                        session_manager.is_speaking[session_id] = False
                        audio_buffer = bytes(session_manager.audio_buffers[session_id])
                        
                        if len(audio_buffer) > 1600:  # At least 0.1 second of audio
                            # Process asynchronously
                            task = asyncio.create_task(
                                process_and_respond(session_id, audio_buffer, agent)
                            )
                            session_manager.add_task(session_id, task)
                        
                        # Clear buffer
                        session_manager.audio_buffers[session_id] = bytearray()
                        
                    elif msg_type == "text":
                        # Direct text input
                        text_content = data.get("content", "").strip()
                        if text_content:
                            task = asyncio.create_task(
                                process_text_and_respond(session_id, text_content, agent)
                            )
                            session_manager.add_task(session_id, task)
                            
                    elif msg_type == "audio_chunk":
                        # Base64 encoded audio chunk
                        audio_b64 = data.get("data", "")
                        if audio_b64:
                            audio_bytes = base64.b64decode(audio_b64)
                            session_manager.audio_buffers[session_id].extend(audio_bytes)
                            
                    elif msg_type == "process_audio":
                        # Process current audio buffer
                        audio_buffer = bytes(session_manager.audio_buffers[session_id])
                        if len(audio_buffer) > 1600:
                            task = asyncio.create_task(
                                process_and_respond(session_id, audio_buffer, agent)
                            )
                            session_manager.add_task(session_id, task)
                        session_manager.audio_buffers[session_id] = bytearray()
                    
                    elif msg_type == "audio_data":
                        # WAV audio data from frontend VAD
                        audio_b64 = data.get("data", "")
                        if audio_b64:
                            logger.info("audio_data_received", 
                                       session_id=session_id, 
                                       size=len(audio_b64))
                            audio_bytes = base64.b64decode(audio_b64)
                            # Process immediately
                            # Process immediately
                            task = asyncio.create_task(
                                process_and_respond(session_id, audio_bytes, agent)
                            )
                            session_manager.add_task(session_id, task)
                            
                    elif msg_type == "reset":
                        agent.reset_conversation()
                        await session_manager.send_json(session_id, {
                            "type": "reset_confirmed",
                            "message": "Conversation reset. Let's start fresh!"
                        })
                        
                except json.JSONDecodeError:
                    logger.warning("invalid_json_message", session_id=session_id)
                    
    except WebSocketDisconnect:
        logger.info("websocket_disconnect", session_id=session_id)
    except Exception as e:
        logger.error("websocket_error", session_id=session_id, error=str(e))
    finally:
        session_manager.disconnect(session_id)


async def process_and_respond(session_id: str, audio_data: bytes, agent):
    """Process audio and send response"""
    try:
        # Transcribe audio
        transcript = await agent.process_audio_input(audio_data)
        
        if not transcript:
            await session_manager.send_json(session_id, {
                "type": "no_speech",
                "message": "No speech detected"
            })
            return
        
        # Send transcription to client
        await session_manager.send_json(session_id, {
            "type": "transcription",
            "text": transcript
        })
        
        # Generate response
        response = await agent.generate_response(transcript)
        
        # Send response text
        await session_manager.send_json(session_id, {
            "type": "response",
            "text": response
        })
        
        # Notify client that coach is speaking
        await session_manager.send_json(session_id, {
            "type": "speaking_start"
        })
        
        # Generate complete audio buffer
        full_audio_buffer = bytearray()
        async for audio_chunk in agent.synthesize_speech(response):
            full_audio_buffer.extend(audio_chunk)
            
        # Send audio
        if len(full_audio_buffer) > 0:
            await session_manager.send_audio(session_id, bytes(full_audio_buffer))
        
        # Notify client that coach finished speaking
        await session_manager.send_json(session_id, {
            "type": "speaking_end"
        })
        
    except Exception as e:
        logger.error("process_and_respond_error", session_id=session_id, error=str(e))
        await session_manager.send_json(session_id, {
            "type": "error",
            "message": "Error processing audio"
        })


async def process_text_and_respond(session_id: str, text: str, agent):
    """Process text input and send response"""
    try:
        # Send transcription confirmation
        await session_manager.send_json(session_id, {
            "type": "transcription",
            "text": text
        })
        
        # Generate response
        response = await agent.generate_response(text)
        
        # Send response text
        await session_manager.send_json(session_id, {
            "type": "response",
            "text": response
        })
        
        # Notify client that coach is speaking
        await session_manager.send_json(session_id, {
            "type": "speaking_start"
        })
        
        # Stream TTS audio
        async for audio_chunk in agent.synthesize_speech(response):
            await session_manager.send_audio(session_id, audio_chunk)
        
        # Notify client that coach finished speaking
        await session_manager.send_json(session_id, {
            "type": "speaking_end"
        })
        
    except Exception as e:
        logger.error("process_text_and_respond_error", session_id=session_id, error=str(e))
        await session_manager.send_json(session_id, {
            "type": "error",
            "message": "Error processing text"
        })
