"""
Session Management API Routes
Handles CRUD operations for pitch practice sessions
"""

from fastapi import APIRouter, HTTPException, Request
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import json
import os
from pathlib import Path
import structlog

# Import title generator
from utils.title_generator import TitleGenerator

router = APIRouter()
logger = structlog.get_logger(__name__)

# Session storage path
SESSIONS_DIR = Path(__file__).parent.parent.parent / "data" / "sessions"
SESSIONS_DIR.mkdir(parents=True, exist_ok=True)


class SessionCreate(BaseModel):
    title: str
    mode: str  # 'pitch', 'qa', 'negotiation', 'record', 'upload'
    user_id: str


class SessionUpdate(BaseModel):
    title: Optional[str] = None
    transcript: Optional[str] = None
    analysis: Optional[dict] = None
    summary: Optional[str] = None
    duration: Optional[int] = None
    status: Optional[str] = None  # 'active', 'completed', 'archived'
    chat_history: Optional[List[dict]] = None  # Conversation memory for session resume


class Session(BaseModel):
    id: str
    title: str
    mode: str
    user_id: str
    created_at: str
    updated_at: str
    transcript: Optional[str] = None
    analysis: Optional[dict] = None
    summary: Optional[str] = None
    duration: Optional[int] = None  # in seconds
    status: str = "active"  # 'active', 'completed', 'archived'
    completed_at: Optional[str] = None  # ISO timestamp when session completed
    chat_history: Optional[List[dict]] = None  # [{role: "human/ai", content: "..."}]


def _get_user_sessions_file(user_id: str) -> Path:
    """Get the path to a user's sessions file"""
    return SESSIONS_DIR / f"{user_id}_sessions.json"


def _load_sessions(user_id: str) -> List[dict]:
    """Load all sessions for a user"""
    sessions_file = _get_user_sessions_file(user_id)
    if sessions_file.exists():
        with open(sessions_file, 'r') as f:
            return json.load(f)
    return []


def _save_sessions(user_id: str, sessions: List[dict]):
    """Save sessions for a user"""
    sessions_file = _get_user_sessions_file(user_id)
    with open(sessions_file, 'w') as f:
        json.dump(sessions, f, indent=2)


@router.post("/sessions", response_model=Session)
async def create_session(session_data: SessionCreate):
    """Create a new pitch practice session"""
    sessions = _load_sessions(session_data.user_id)
    
    # Generate session ID
    session_id = f"session_{len(sessions) + 1}_{int(datetime.now().timestamp())}"
    
    new_session = {
        "id": session_id,
        "title": session_data.title,
        "mode": session_data.mode,
        "user_id": session_data.user_id,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "transcript": None,
        "analysis": None,
        "summary": None,
        "duration": None,
        "status": "active"
    }
    
    sessions.append(new_session)
    _save_sessions(session_data.user_id, sessions)
    
    return Session(**new_session)


@router.get("/sessions", response_model=List[Session])
async def get_sessions(user_id: str, limit: Optional[int] = 50, status: Optional[str] = None):
    """Get all sessions for a user"""
    sessions = _load_sessions(user_id)
    
    # Filter by status if provided
    if status:
        sessions = [s for s in sessions if s.get("status") == status]
    
    # Sort by updated_at (most recent first)
    sessions.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
    
    # Apply limit
    sessions = sessions[:limit]
    
    return [Session(**s) for s in sessions]


@router.get("/sessions/{session_id}", response_model=Session)
async def get_session(session_id: str, user_id: str):
    """Get a specific session"""
    sessions = _load_sessions(user_id)
    
    session = next((s for s in sessions if s["id"] == session_id), None)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return Session(**session)


@router.patch("/sessions/{session_id}", response_model=Session)
async def update_session(session_id: str, user_id: str, updates: SessionUpdate):
    """Update a session with auto-title generation on first message"""
    sessions = _load_sessions(user_id)
    
    session_index = next((i for i, s in enumerate(sessions) if s["id"] == session_id), None)
    if session_index is None:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_index]
    update_data = updates.dict(exclude_unset=True)
    
    # Check if chat_history is being updated  
    if "chat_history" in update_data:
        new_chat_history = update_data["chat_history"]
        existing_chat = session.get("chat_history", [])
        
        # Check if this update adds a first user message
        if new_chat_history and len(existing_chat) == 0:
            # Find first user/human message
            first_user_msg = None
            for msg in new_chat_history:
                if msg.get("role") in ["user", "human"]:
                    first_user_msg = msg.get("content")
                    break
            
            # Check if title is still default (Live Session or Recorded Session with timestamp)
            current_title = session.get("title", "")
            is_default_title = (
                current_title.startswith("Live Session") or 
                current_title.startswith("Recorded Session") or
                current_title.startswith("New Session")
            )
            
            # Auto-generate title if message found and title is still default
            if first_user_msg and is_default_title:
                try:
                    # Initialize title generator
                    title_gen = TitleGenerator()
                    
                    # Determine session type from mode
                    session_mode = session.get("mode", "pitch")
                    session_type = "recorded" if session_mode == "recorded" else "live"
                    
                    # Generate title
                    new_title = await title_gen.generate_from_message(
                        message=first_user_msg,
                        mode=session_mode,
                        session_type=session_type,
                        max_words=5
                    )
                    
                    # Ensure unique title
                    existing_titles = [s["title"] for s in sessions if s["id"] != session_id]
                    new_title = title_gen.ensure_unique_title(new_title, existing_titles)
                    
                    session["title"] = new_title
                    logger.info("auto_title_generated", session_id=session_id, title=new_title)
                    
                except Exception as e:
                    logger.error("title_generation_failed", error=str(e))
                    # Continue with update even if title generation fails
    
    # Update all other fields
    for field, value in update_data.items():
        session[field] = value
    
    session["updated_at"] = datetime.now().isoformat()
    
    sessions[session_index] = session
    _save_sessions(user_id, sessions)
    
    return Session(**session)


@router.post("/sessions/{session_id}/complete")
async def complete_session(session_id: str, user_id: str):
    """
    Mark a session as completed.
    - Sets status = 'completed'
    - Sets completed_at timestamp
    - Generates transcript from chat_history if needed
    """
    sessions = _load_sessions(user_id)
    
    session_index = next((i for i, s in enumerate(sessions) if s["id"] == session_id), None)
    if session_index is None:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_index]
    
    # Update session status
    session["status"] = "completed"
    session["completed_at"] = datetime.now().isoformat()
    session["updated_at"] = datetime.now().isoformat()
    
    # Generate transcript from chat_history if exists but no transcript
    if session.get("chat_history") and not session.get("transcript"):
        transcript_lines = []
        for turn in session["chat_history"]:
            role = "You" if turn.get("role") in ["user", "human"] else "Marcus Sterling"
            content = turn.get("content", "")
            transcript_lines.append(f"{role}: {content}")
        
        session["transcript"] = "\n\n".join(transcript_lines)
        logger.info("transcript_generated", session_id=session_id)
    
    # Save updated session
    sessions[session_index] = session
    _save_sessions(user_id, sessions)
    
    logger.info("session_completed", session_id=session_id)
    
    return {
        "success": True,
        "session": Session(**session),
        "message": "Session completed successfully"
    }


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, user_id: str):
    """Delete a session"""
    sessions = _load_sessions(user_id)
    
    session_index = next((i for i, s in enumerate(sessions) if s["id"] == session_id), None)
    if session_index is None:
        raise HTTPException(status_code=404, detail="Session not found")
    
    sessions.pop(session_index)
    _save_sessions(user_id, sessions)
    
    return {"message": "Session deleted successfully"}


@router.post("/sessions/{session_id}/complete")
async def complete_session(session_id: str, user_id: str):
    """Mark a session as completed"""
    sessions = _load_sessions(user_id)
    
    session_index = next((i for i, s in enumerate(sessions) if s["id"] == session_id), None)
    if session_index is None:
        raise HTTPException(status_code=404, detail="Session not found")
    
    sessions[session_index]["status"] = "completed"
    sessions[session_index]["updated_at"] = datetime.now().isoformat()
    
    _save_sessions(user_id, sessions)
    
    return Session(**sessions[session_index])


@router.get("/sessions/stats/{user_id}")
async def get_session_stats(user_id: str):
    """Get statistics about user sessions"""
    sessions = _load_sessions(user_id)
    
    total_sessions = len(sessions)
    completed_sessions = len([s for s in sessions if s.get("status") == "completed"])
    total_duration = sum(s.get("duration", 0) or 0 for s in sessions)
    
    # Count by mode
    mode_counts = {}
    for session in sessions:
        mode = session.get("mode", "unknown")
        mode_counts[mode] = mode_counts.get(mode, 0) + 1
    
    return {
        "total_sessions": total_sessions,
        "completed_sessions": completed_sessions,
        "active_sessions": total_sessions - completed_sessions,
        "total_duration": total_duration,
        "sessions_by_mode": mode_counts,
        "recent_sessions": sorted(sessions, key=lambda x: x.get("updated_at", ""), reverse=True)[:5]
    }
