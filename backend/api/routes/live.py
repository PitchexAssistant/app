"""
WebSocket endpoint for Gemini Live pitch coaching sessions
Handles real-time audio streaming and bidirectional communication
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from typing import Optional
import json
import asyncio
import structlog

from services.gemini_live_service import GeminiLiveService
from services.tts_service import get_tts_service, TTSService

logger = structlog.get_logger()
router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections for live sessions"""
    
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
    
    async def connect(self, session_id: str, websocket: WebSocket):
        """Accept and store WebSocket connection"""
        await websocket.accept()
        self.active_connections[session_id] = websocket
        logger.info("websocket_connected", session_id=session_id)
    
    def disconnect(self, session_id: str):
        """Remove WebSocket connection"""
        if session_id in self.active_connections:
            del self.active_connections[session_id]
            logger.info("websocket_disconnected", session_id=session_id)
    
    async def send_message(self, session_id: str, message: dict):
        """Send message to specific session"""
        if session_id in self.active_connections:
            websocket = self.active_connections[session_id]
            await websocket.send_json(message)
    
    async def send_audio(self, session_id: str, audio_data: bytes):
        """Send audio data to specific session"""
        if session_id in self.active_connections:
            websocket = self.active_connections[session_id]
            await websocket.send_bytes(audio_data)


manager = ConnectionManager()


def get_live_service() -> GeminiLiveService:
    """Dependency to get Gemini Live Service"""
    # This should be initialized in app startup
    # For now, create a new instance
    return GeminiLiveService()


@router.websocket("/ws/live/{session_id}")
async def live_session_endpoint(
    websocket: WebSocket,
    session_id: str,
    mode: str = Query(default="pitch"),
    context: Optional[str] = Query(default=None)
):
    """
    WebSocket endpoint for live pitch coaching sessions
    
    Message format (JSON):
    - type: "audio" | "text" | "mode_change" | "end_session" | "ping"
    - data: message payload
    
    Audio messages:
    - type: "audio"
    - data: base64 encoded PCM audio data
    
    Text messages:
    - type: "text"
    - data: text content
    
    Mode change:
    - type: "mode_change"
    - data: new mode ("pitch" | "qa" | "negotiation")
    
    End session:
    - type: "end_session"
    """
    
    live_service = get_live_service()
    
    await manager.connect(session_id, websocket)
    
    try:
        # Create session
        await live_service.create_session(session_id, mode=mode, context=context)
        
        # Connect to Gemini Live API
        try:
            connection = await live_service.connect_session(session_id)
        except ValueError as ve:
            # Send user-friendly error message
            error_msg = str(ve)
            await manager.send_message(session_id, {
                "type": "error",
                "message": error_msg,
                "code": "CONNECTION_FAILED"
            })
            logger.error("connection_failed", session_id=session_id, error=error_msg)
            await websocket.close(code=1011, reason=error_msg[:100])  # Limit reason length
            return
        except Exception as e:
            error_msg = f"Unexpected error connecting to AI service: {str(e)}"
            await manager.send_message(session_id, {
                "type": "error",
                "message": error_msg,
                "code": "UNEXPECTED_ERROR"
            })
            logger.error("unexpected_connection_error", session_id=session_id, error=str(e))
            await websocket.close(code=1011, reason="Internal error")
            return
        
        # Send connection confirmation
        await manager.send_message(session_id, {
            "type": "connection",
            "status": "connected",
            "session_id": session_id,
            "mode": mode,
            "message": "Welcome! I'm Marcus Sterling, and I'm here to help you refine your pitch. When you're ready, start presenting and I'll provide real-time feedback."
        })
        
        # Get TTS service for converting text to speech
        tts_service = get_tts_service()
        
        # Create task for receiving from Gemini
        async def receive_from_gemini():
            """Background task to receive responses from Gemini and forward to client"""
            try:
                async for response in live_service.receive_responses(session_id):
                    if response["type"] == "audio":
                        # Send audio data as bytes (Gemini native audio)
                        await manager.send_audio(session_id, response["data"])
                    elif response["type"] == "text":
                        # Convert text to speech using Edge TTS
                        text_content = response["content"]
                        
                        # Send text message first (for transcript)
                        await manager.send_message(session_id, {
                            "type": "assistant_message",
                            "content": text_content
                        })
                        
                        # Generate TTS audio and send
                        try:
                            logger.info("generating_tts_audio", text_length=len(text_content))
                            
                            # Stream TTS audio chunks
                            async for audio_chunk in tts_service.generate_speech_stream(
                                text=text_content,
                                rate="+5%"  # Slightly faster for natural coaching feel
                            ):
                                await manager.send_audio(session_id, audio_chunk)
                            
                            logger.info("tts_audio_sent", session_id=session_id)
                            
                        except Exception as tts_error:
                            logger.error("tts_generation_error", error=str(tts_error))
                            # TTS failed, but text was already sent
                            await manager.send_message(session_id, {
                                "type": "tts_error",
                                "message": "Voice synthesis unavailable"
                            })
                            
                    elif response["type"] == "metadata":
                        # Send metadata
                        await manager.send_message(session_id, {
                            "type": "metadata",
                            "data": response["data"]
                        })
            except Exception as e:
                logger.error("gemini_receive_error", session_id=session_id, error=str(e))
                await manager.send_message(session_id, {
                    "type": "error",
                    "message": f"Error receiving from AI: {str(e)}"
                })
        
        # Start receiving task
        receive_task = asyncio.create_task(receive_from_gemini())
        
        # Main loop: receive from client
        while True:
            # Receive message from client
            message = await websocket.receive()
            
            # Handle different message types
            if "text" in message:
                # JSON message
                try:
                    data = json.loads(message["text"])
                    msg_type = data.get("type")
                    
                    if msg_type == "text":
                        # Text message to AI
                        text_content = data.get("data", "")
                        await live_service.send_text(session_id, text_content)
                        
                        # Echo back to client
                        await manager.send_message(session_id, {
                            "type": "user_message",
                            "content": text_content
                        })
                    
                    elif msg_type == "mode_change":
                        # Change coaching mode
                        new_mode = data.get("data")
                        result = await live_service.change_mode(session_id, new_mode)
                        await manager.send_message(session_id, {
                            "type": "mode_changed",
                            "mode": new_mode,
                            "message": f"Coaching mode changed to {new_mode.upper()}"
                        })
                    
                    elif msg_type == "end_session":
                        # End the session
                        result = await live_service.end_session(session_id)
                        await manager.send_message(session_id, {
                            "type": "session_ended",
                            "summary": result
                        })
                        break
                    
                    elif msg_type == "ping":
                        # Heartbeat
                        await manager.send_message(session_id, {
                            "type": "pong"
                        })
                
                except json.JSONDecodeError:
                    logger.error("invalid_json", session_id=session_id)
                    await manager.send_message(session_id, {
                        "type": "error",
                        "message": "Invalid JSON format"
                    })
            
            elif "bytes" in message:
                # Audio data
                audio_data = message["bytes"]
                await live_service.send_audio(session_id, audio_data)
    
    except WebSocketDisconnect:
        logger.info("websocket_disconnect", session_id=session_id)
    except Exception as e:
        logger.error("websocket_error", session_id=session_id, error=str(e))
        try:
            await manager.send_message(session_id, {
                "type": "error",
                "message": f"Session error: {str(e)}"
            })
        except:
            pass
    finally:
        # Cleanup
        manager.disconnect(session_id)
        try:
            await live_service.end_session(session_id)
            live_service.cleanup_session(session_id)
        except:
            pass
        
        # Cancel receive task
        if 'receive_task' in locals():
            receive_task.cancel()


@router.get("/live/sessions/{session_id}")
async def get_session_info(session_id: str):
    """Get information about a live session"""
    live_service = get_live_service()
    session_data = live_service.get_session(session_id)
    
    if not session_data:
        return {"error": "Session not found"}, 404
    
    return {
        "session_id": session_id,
        "mode": session_data["mode"],
        "active": session_data["active"],
        "message_count": len(session_data["messages"])
    }
