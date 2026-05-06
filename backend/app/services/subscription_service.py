from app.services.supabase_client import supabase
import logging

logger = logging.getLogger("sol")

FREE_MESSAGE_LIMIT = 10

async def get_subscription(user_id: str) -> dict:
    res = supabase.table("subscriptions")\
        .select("*")\
        .eq("user_id", user_id)\
        .limit(1).execute()

    if not res.data:
        # Create one if missing
        insert_res = supabase.table("subscriptions").insert({
            "user_id": user_id,
            "plan": "free",
            "status": "active"
        }).execute()
        return insert_res.data[0] if insert_res.data else {"plan": "free", "status": "active"}

    return res.data[0]


async def is_pro(user_id: str) -> bool:
    sub = await get_subscription(user_id)
    plan = sub.get("plan", "free")
    if plan.startswith("pro_") and sub.get("status") in ("active", "gifted"):
        return True
    return False


async def get_message_count(user_id: str) -> int:
    res = supabase.table("profiles")\
        .select("total_messages_sent")\
        .eq("id", user_id)\
        .limit(1).execute()
    if res.data:
        return res.data[0].get("total_messages_sent") or 0
    return 0


async def increment_message_count(user_id: str):
    current = await get_message_count(user_id)
    supabase.table("profiles")\
        .update({"total_messages_sent": current + 1})\
        .eq("id", user_id).execute()


async def check_can_send_message(user_id: str) -> dict:
    """
    Returns:
      { "allowed": True }
      { "allowed": False, "reason": "trial_exceeded", "messages_used": 10, "limit": 10 }
    """
    pro = await is_pro(user_id)
    if pro:
        return {"allowed": True}

    count = await get_message_count(user_id)
    if count >= FREE_MESSAGE_LIMIT:
        return {
            "allowed": False,
            "reason": "trial_exceeded",
            "messages_used": count,
            "limit": FREE_MESSAGE_LIMIT
        }

    return {
        "allowed": True,
        "messages_used": count,
        "limit": FREE_MESSAGE_LIMIT,
        "messages_remaining": FREE_MESSAGE_LIMIT - count
    }
