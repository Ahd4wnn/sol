from fastapi import APIRouter, Request, HTTPException, Depends
from app.services.supabase_client import supabase
from app.config import settings
import logging
from datetime import datetime, timedelta
import random

logger = logging.getLogger("sol")
router = APIRouter(prefix="/notifications", tags=["notifications"])

MORNING_MESSAGES = [
  ("Good morning ☀️", "How are you actually starting today? Sol is here."),
  ("New day, real talk", "What's on your mind before the day takes over?"),
  ("Morning check-in", "5 minutes with Sol before the chaos starts."),
  ("Hey.", "How did you sleep? Sol wants to know."),
  ("Before you spiral today —", "Come say hi to Sol first."),
]

AFTERNOON_MESSAGES = [
  ("Midday check ☀️", "How's the energy? Still running or running on fumes?"),
  ("Quick check-in", "You've been going all day. How are you actually doing?"),
  ("Afternoon, real one.", "Got 5 minutes? Sol's been thinking about you."),
  ("How's the day treating you?", "Sol is here if you need to vent."),
  ("Checking in", "What's the vibe right now? No filter needed."),
]

EVENING_MESSAGES = [
  ("End of day 🌙", "How are you really feeling right now?"),
  ("Before you sleep —", "What's one thing that's been sitting with you today?"),
  ("Evening check-in", "Sol is here. The day is almost done. How was it?"),
  ("Hey, it's late.", "Still carrying something? Sol's listening."),
  ("Night check ☀️", "How did today go? The real version."),
]

def verify_cron(request: Request):
    secret = request.headers.get("x-cron-secret", "")
    if secret != settings.cron_secret:
        raise HTTPException(status_code=403,
            detail={"error": True, "message": "Forbidden"})

@router.post("/send-morning")
async def send_morning(request: Request):
    verify_cron(request)
    return await _send_batch(MORNING_MESSAGES, "sol-morning")

@router.post("/send-afternoon")
async def send_afternoon(request: Request):
    verify_cron(request)
    return await _send_batch(AFTERNOON_MESSAGES, "sol-afternoon")

@router.post("/send-evening")
async def send_evening(request: Request):
    verify_cron(request)
    return await _send_batch(EVENING_MESSAGES, "sol-evening")

async def _send_batch(messages: list, tag: str) -> dict:
    from app.routers.push import send_push_to_user

    # Get all users with push subscriptions
    subs = supabase.table("push_subscriptions")\
        .select("user_id")\
        .execute()

    user_ids = list({s["user_id"] for s in (subs.data or [])})

    sent = 0
    for user_id in user_ids:
        try:
            title, body = random.choice(messages)
            await send_push_to_user(
                user_id, title, body,
                url="/dashboard",
                tag=tag
            )
            sent += 1
        except Exception as e:
            logger.warning(f"Push failed for {user_id}: {e}")

    logger.info(f"Sent {sent} {tag} notifications")
    return {"sent": sent, "tag": tag}


@router.post("/daily-maintenance")
async def daily_maintenance(request: Request):
    """Run once daily — apply memory decay + send nudges."""
    verify_cron(request)
    from app.services.memory_extractor import apply_memory_decay
    await apply_memory_decay()
    return {"success": True, "ran": "memory_decay"}
