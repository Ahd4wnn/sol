from fastapi import APIRouter, Request, HTTPException
from app.services.supabase_client import supabase
from app.config import settings
from app.routers.push import send_push_to_user
import logging

logger = logging.getLogger("sol")
router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.post("/send-daily-nudges")
async def send_daily_nudges(request: Request):
    # Verify it's called from admin or cron secret
    secret = request.headers.get("x-cron-secret")
    if secret != settings.cron_secret:
        raise HTTPException(status_code=403)

    from datetime import datetime, timedelta

    # Find users who haven't had a session in 3+ days
    three_days_ago = (datetime.utcnow() - timedelta(days=3)).isoformat()

    sessions_res = supabase.table("therapy_sessions")\
        .select("user_id, created_at")\
        .lt("created_at", three_days_ago)\
        .order("created_at", desc=True).execute()

    # Get unique user IDs who haven't sessioned recently
    seen = set()
    stale_users = []
    for s in (sessions_res.data or []):
        uid = s["user_id"]
        if uid not in seen:
            seen.add(uid)
            stale_users.append(uid)

    NUDGE_MESSAGES = [
        ("Sol misses you.", "You don't have to have it figured out. Just say hi."),
        ("Hey. How are you actually doing?", "Sol's here whenever you're ready."),
        ("It's been a few days.", "Even a 5-minute check-in can shift things."),
        ("No pressure.", "But Sol's been thinking about you."),
    ]

    import random
    for user_id in stale_users[:50]:  # cap at 50 per run
        title, body = random.choice(NUDGE_MESSAGES)
        await send_push_to_user(user_id, title, body,
                                url="/session/new", tag="sol-nudge")

    return {"sent": len(stale_users[:50])}
