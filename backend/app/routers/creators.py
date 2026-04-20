from fastapi import APIRouter, Depends, HTTPException, Request
from app.services.supabase_client import supabase
from app.config import settings
from datetime import datetime
import hashlib
import logging

logger = logging.getLogger("sol")
router = APIRouter(prefix="/creators", tags=["creators"])

COMMISSION_RATE = 0.30  # 30%

# ── PUBLIC ENDPOINTS (no auth needed) ──

@router.get("/validate-code/{code}")
async def validate_promo_code(code: str):
    """Called on auth page when user enters promo code."""
    try:
        res = supabase.table("creators")\
            .select("id, name, handle, promo_code, user_discount, bonus_messages")\
            .eq("promo_code", code.upper())\
            .eq("status", "active")\
            .limit(1).execute()

        if not res.data:
            raise HTTPException(status_code=404, detail={
                "error": True, "message": "Invalid promo code."
            })

        creator = res.data[0]
        return {
            "valid": True,
            "creator_name": creator["name"],
            "handle": creator["handle"],
            "discount": creator["user_discount"],
            "bonus_messages": creator["bonus_messages"],
            "message": f"{creator['user_discount']}% off + {creator['bonus_messages']} bonus messages"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"validate_promo_code failed: {e}")
        raise HTTPException(status_code=500, detail={"error": True, "message": "Something went wrong."})


@router.get("/validate-ref/{slug}")
async def validate_ref_link(slug: str):
    """Called when user lands via ?ref=slug."""
    try:
        res = supabase.table("creators")\
            .select("id, name, handle, ref_slug, user_discount, bonus_messages")\
            .eq("ref_slug", slug.lower())\
            .eq("status", "active")\
            .limit(1).execute()

        if not res.data:
            return {"valid": False}

        creator = res.data[0]
        return {
            "valid": True,
            "creator_id": creator["id"],
            "creator_name": creator["name"],
            "discount": creator["user_discount"],
            "bonus_messages": creator["bonus_messages"],
        }
    except Exception as e:
        logger.error(f"validate_ref_link failed: {e}")
        return {"valid": False}


# ── CREATOR AUTH ──

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def create_creator_token(creator_id: str) -> str:
    return hashlib.sha256(
        f"{creator_id}{settings.razorpay_key_secret}".encode()
    ).hexdigest()

async def get_current_creator(request: Request):
    token = request.headers.get("x-creator-token")
    creator_id = request.headers.get("x-creator-id")
    if not token or not creator_id:
        raise HTTPException(status_code=401, detail={"error": True, "message": "Not authenticated"})
    expected = create_creator_token(creator_id)
    if token != expected:
        raise HTTPException(status_code=401, detail={"error": True, "message": "Invalid token"})
    res = supabase.table("creators").select("*").eq("id", creator_id).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=401, detail={"error": True, "message": "Creator not found"})
    return res.data[0]


@router.post("/login")
async def creator_login(payload: dict):
    try:
        email = payload.get("email", "").lower().strip()
        password = payload.get("password", "")

        creator_res = supabase.table("creators")\
            .select("id, name, email, status")\
            .eq("email", email).limit(1).execute()

        if not creator_res.data:
            raise HTTPException(status_code=401, detail={
                "error": True, "message": "Invalid email or password."
            })

        creator = creator_res.data[0]

        if creator["status"] != "active":
            raise HTTPException(status_code=403, detail={
                "error": True, "message": "Your account has been paused."
            })

        account_res = supabase.table("creator_accounts")\
            .select("password_hash")\
            .eq("creator_id", creator["id"]).limit(1).execute()

        if not account_res.data:
            raise HTTPException(status_code=401, detail={
                "error": True, "message": "Invalid email or password."
            })

        if not verify_password(password, account_res.data[0]["password_hash"]):
            raise HTTPException(status_code=401, detail={
                "error": True, "message": "Invalid email or password."
            })

        supabase.table("creator_accounts")\
            .update({"last_login": datetime.utcnow().isoformat()})\
            .eq("creator_id", creator["id"]).execute()

        token = create_creator_token(creator["id"])

        return {
            "success": True,
            "creator_id": creator["id"],
            "token": token,
            "name": creator["name"],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"creator_login failed: {e}")
        raise HTTPException(status_code=500, detail={"error": True, "message": "Something went wrong."})


# ── CREATOR DASHBOARD DATA ──

@router.get("/me")
async def get_creator_me(creator=Depends(get_current_creator)):
    return creator


@router.get("/stats")
async def get_creator_stats(creator=Depends(get_current_creator)):
    try:
        creator_id = creator["id"]

        # All referrals
        refs_res = supabase.table("referrals")\
            .select("*")\
            .eq("creator_id", creator_id)\
            .order("created_at", desc=True).execute()

        refs = refs_res.data or []
        total_clicks = len(refs)
        conversions = [r for r in refs if r.get("converted")]
        total_conversions = len(conversions)
        total_earned = sum(r.get("commission_amount") or 0 for r in conversions)

        pending = sum(
            r.get("commission_amount") or 0
            for r in conversions
            if r.get("commission_status") == "pending"
        )
        paid_out = creator.get("total_paid") or 0

        # Recent referrals (last 10)
        recent = refs[:10]

        return {
            "total_clicks": total_clicks,
            "total_conversions": total_conversions,
            "conversion_rate": round(
                (total_conversions / total_clicks * 100) if total_clicks else 0, 1
            ),
            "total_earned": round(total_earned, 2),
            "pending_payout": round(pending, 2),
            "paid_out": round(paid_out, 2),
            "recent_referrals": recent,
            "promo_code": creator["promo_code"],
            "ref_slug": creator["ref_slug"],
            "commission_rate": creator["commission_rate"],
            "user_discount": creator["user_discount"],
        }
    except Exception as e:
        logger.error(f"get_creator_stats failed: {e}")
        raise HTTPException(status_code=500, detail={"error": True, "message": "Could not fetch stats."})
