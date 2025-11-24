from fastapi import APIRouter, HTTPException
from livekit import api
import os
from dotenv import load_dotenv
import structlog

load_dotenv()
logger = structlog.get_logger()

router = APIRouter()

@router.get("/token")
async def get_token(room: str, username: str):
    """Generate a LiveKit token for a user"""
    try:
        api_key = os.getenv("LIVEKIT_API_KEY")
        api_secret = os.getenv("LIVEKIT_API_SECRET")
        livekit_url = os.getenv("LIVEKIT_URL")

        if not api_key or not api_secret or not livekit_url:
            raise HTTPException(status_code=500, detail="LiveKit credentials not configured")

        token = api.AccessToken(api_key, api_secret) \
            .with_identity(username) \
            .with_name(username) \
            .with_grants(api.VideoGrants(
                room_join=True,
                room=room,
            ))

        return {
            "token": token.to_jwt(),
            "url": livekit_url
        }
    except Exception as e:
        logger.error("token_generation_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
