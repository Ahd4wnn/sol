from fastapi import APIRouter, Depends, HTTPException
from app.middleware.auth import get_current_user
from app.services.supabase_client import supabase
from app.config import settings
from pywebpush import webpush, WebPushException
import json
import logging

logger = logging.getLogger("sol")
router = APIRouter(prefix="/push", tags=["push"])

@router.get("/vapid-public-key")
async def get_vapid_key():
    return {"public_key": settings.vapid_public_key}

@router.post("/subscribe")
async def subscribe(payload: dict, user=Depends(get_current_user)):
    try:
        supabase.table("push_subscriptions").upsert({
            "user_id": user.id,
            "endpoint": payload["endpoint"],
            "p256dh": payload["keys"]["p256dh"],
            "auth": payload["keys"]["auth"],
        }, on_conflict="user_id,endpoint").execute()
        return {"success": True}
    except Exception as e:
        logger.error(f"push subscribe failed: {e}")
        raise HTTPException(status_code=500, detail={"error": True, "message": "Subscription failed"})

@router.post("/unsubscribe")
async def unsubscribe(payload: dict, user=Depends(get_current_user)):
    try:
        supabase.table("push_subscriptions")\
            .delete()\
            .eq("user_id", user.id)\
            .eq("endpoint", payload.get("endpoint", "")).execute()
        return {"success": True}
    except Exception as e:
        logger.error(f"push unsubscribe failed: {e}")
        raise HTTPException(status_code=500, detail={"error": True, "message": "Unsubscribe failed"})

async def send_push_to_user(user_id: str, title: str, body: str,
                             url: str = "/dashboard", tag: str = "sol"):
    try:
        subs = supabase.table("push_subscriptions")\
            .select("endpoint, p256dh, auth")\
            .eq("user_id", user_id).execute()

        for sub in (subs.data or []):
            try:
                webpush(
                    subscription_info={
                        "endpoint": sub["endpoint"],
                        "keys": {"p256dh": sub["p256dh"], "auth": sub["auth"]}
                    },
                    data=json.dumps({"title": title, "body": body,
                                     "url": url, "tag": tag}),
                    vapid_private_key=settings.vapid_private_key,
                    vapid_claims={"sub": f"mailto:{settings.vapid_claims_email}"}
                )
            except WebPushException as e:
                if "410" in str(e) or "404" in str(e):
                    # Subscription expired — remove it
                    supabase.table("push_subscriptions")\
                        .delete()\
                        .eq("endpoint", sub["endpoint"]).execute()
    except Exception as e:
        logger.error(f"send_push_to_user failed for {user_id}: {e}")
