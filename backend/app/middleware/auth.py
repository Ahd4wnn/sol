import logging
from fastapi import HTTPException, Header
from app.services.supabase_client import supabase
from typing import Optional

logger = logging.getLogger("sol")

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail={"error": True, "message": "No authorization header", "code": "NO_TOKEN"}
        )

    # Handle both "Bearer token" and raw token
    token = authorization
    if authorization.startswith("Bearer "):
        token = authorization[7:]

    if not token or token == "undefined" or token == "null":
        raise HTTPException(
            status_code=401,
            detail={"error": True, "message": "Invalid token", "code": "INVALID_TOKEN"}
        )

    try:
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=401,
                detail={"error": True, "message": "Token invalid or expired", "code": "TOKEN_EXPIRED"}
            )
        return user_response.user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth verification failed: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=401,
            detail={"error": True, "message": "Authentication failed", "code": "AUTH_FAILED"}
        )
