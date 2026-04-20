from fastapi import APIRouter, Depends, HTTPException
from app.middleware.auth import get_current_user
from app.services.supabase_client import supabase
from app.config import settings
from datetime import datetime
import string
import random
import logging

logger = logging.getLogger("sol")
router = APIRouter(prefix="/admin", tags=["admin"])

def require_admin(user=Depends(get_current_user)):
    if user.email != settings.admin_email:
        raise HTTPException(status_code=403, detail={"error": True, "message": "Admin access required"})
    return user

@router.get("/stats")
async def get_stats(admin=Depends(require_admin)):
    try:
        # Total users
        users_res = supabase.table("profiles").select("id", count="exact").execute()
        total_users = users_res.count or 0

        # Pro subscribers
        pro_res = supabase.table("subscriptions")\
            .select("plan, status", count="exact")\
            .in_("plan", ["pro_monthly", "pro_yearly"])\
            .in_("status", ["active", "gifted"]).execute()
        pro_users = pro_res.count or 0

        # Monthly vs yearly breakdown
        monthly_res = supabase.table("subscriptions")\
            .select("id", count="exact")\
            .eq("plan", "pro_monthly")\
            .eq("status", "active").execute()
        yearly_res = supabase.table("subscriptions")\
            .select("id", count="exact")\
            .eq("plan", "pro_yearly")\
            .eq("status", "active").execute()

        monthly_count = monthly_res.count or 0
        yearly_count = yearly_res.count or 0

        # Revenue calculation
        monthly_revenue = (monthly_count * 9) + (yearly_count * (89/12))
        total_revenue_estimate = (monthly_count * 9) + (yearly_count * 89)

        # Total sessions
        sessions_res = supabase.table("therapy_sessions")\
            .select("id", count="exact").execute()

        # Total messages
        messages_res = supabase.table("messages")\
            .select("id", count="exact").execute()

        # Feedback stats
        feedback_res = supabase.table("feedback")\
            .select("id, resolved, category").execute()
        feedback_data = feedback_res.data or []
        unresolved = sum(1 for f in feedback_data if not f.get("resolved"))

        return {
            "users": {
                "total": total_users,
                "pro": pro_users,
                "free": total_users - pro_users,
                "conversion_rate": round((pro_users / total_users * 100), 1) if total_users else 0
            },
            "revenue": {
                "monthly_recurring": round(monthly_revenue, 2),
                "total_collected": round(total_revenue_estimate, 2),
                "monthly_subs": monthly_count,
                "yearly_subs": yearly_count,
            },
            "usage": {
                "total_sessions": sessions_res.count or 0,
                "total_messages": messages_res.count or 0,
            },
            "feedback": {
                "total": len(feedback_data),
                "unresolved": unresolved,
            }
        }
    except Exception as e:
        logger.error(f"admin stats failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": True, "message": "Could not fetch stats"})

@router.get("/users")
async def list_users(admin=Depends(require_admin), page: int = 1, limit: int = 20):
    try:
        offset = (page - 1) * limit
        profiles_res = supabase.table("profiles")\
            .select("id, full_name, preferred_name, created_at, total_messages_sent")\
            .order("created_at", desc=True)\
            .range(offset, offset + limit - 1).execute()

        user_ids = [p["id"] for p in (profiles_res.data or [])]
        subs_res = supabase.table("subscriptions")\
            .select("user_id, plan, status, current_period_end, gifted_note")\
            .in_("user_id", user_ids).execute()

        subs_map = {s["user_id"]: s for s in (subs_res.data or [])}

        users = []
        for profile in (profiles_res.data or []):
            sub = subs_map.get(profile["id"], {})
            users.append({
                **profile,
                "plan": sub.get("plan", "free"),
                "sub_status": sub.get("status", "active"),
                "period_end": sub.get("current_period_end"),
                "gifted_note": sub.get("gifted_note"),
            })

        return {"users": users, "page": page, "limit": limit}
    except Exception as e:
        logger.error(f"admin list_users failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": True, "message": "Could not fetch users"})

@router.post("/gift-pro")
async def gift_pro(payload: dict, admin=Depends(require_admin)):
    """Give any user free Pro access."""
    try:
        user_id = payload.get("user_id")
        plan = payload.get("plan", "pro_monthly")  # pro_monthly or pro_yearly
        note = payload.get("note", "Gifted by admin")
        months = 12 if plan == "pro_yearly" else 1

        from datetime import timedelta
        now = datetime.utcnow()
        period_end = now + timedelta(days=30 * months)

        supabase.table("subscriptions").upsert({
            "user_id": user_id,
            "plan": plan,
            "status": "gifted",
            "gifted_by": admin.email,
            "gifted_note": note,
            "current_period_start": now.isoformat(),
            "current_period_end": period_end.isoformat(),
            "updated_at": now.isoformat()
        }, on_conflict="user_id").execute()

        logger.info(f"Admin gifted Pro: user={user_id} plan={plan} note={note}")
        return {"success": True}
    except Exception as e:
        logger.error(f"gift_pro failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": True, "message": "Could not gift pro"})

@router.post("/revoke-pro")
async def revoke_pro(payload: dict, admin=Depends(require_admin)):
    try:
        user_id = payload.get("user_id")
        supabase.table("subscriptions")\
            .update({"plan": "free", "status": "active", "gifted_note": None})\
            .eq("user_id", user_id).execute()
        return {"success": True}
    except Exception as e:
        logger.error(f"revoke_pro failed: {e}")
        raise HTTPException(status_code=500, detail={"error": True, "message": "Could not revoke"})

@router.get("/feedback")
async def list_feedback(admin=Depends(require_admin), resolved: bool = False):
    try:
        query = supabase.table("feedback")\
            .select("*, profiles(preferred_name, full_name)")\
            .eq("resolved", resolved)\
            .order("created_at", desc=True)\
            .limit(100)
        res = query.execute()
        return {"feedback": res.data or []}
    except Exception as e:
        logger.error(f"list_feedback failed: {e}")
        raise HTTPException(status_code=500, detail={"error": True, "message": "Could not fetch feedback"})

@router.patch("/feedback/{feedback_id}/resolve")
async def resolve_feedback(feedback_id: str, admin=Depends(require_admin)):
    try:
        supabase.table("feedback")\
            .update({"resolved": True})\
            .eq("id", feedback_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": True, "message": "Could not resolve"})

@router.post("/generate-codes")
async def generate_codes(admin=Depends(require_admin)):
    try:
        existing_res = supabase.table("early_member_codes").select("id").execute()
        existing = len(existing_res.data or [])
        if existing >= 100:
            return {"count": 0, "message": "All 100 codes generated max"}
            
        needed = 100 - existing
        new_codes = []
        for i in range(needed):
            code = "SOL-EARLY-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
            new_codes.append({
                "code": code,
                "member_number": existing + i + 1
            })
            
        if new_codes:
            supabase.table("early_member_codes").insert(new_codes).execute()
            
        return {"count": len(new_codes)}
    except Exception as e:
        logger.error(f"generate-codes failed: {e}")
        raise HTTPException(status_code=500, detail={"error": True, "message": "Could not generate codes"})

@router.get("/codes")
async def list_codes(admin=Depends(require_admin)):
    try:
        res = supabase.table("early_member_codes")\
            .select("*, profiles(preferred_name, full_name, email)")\
            .order("member_number", desc=False)\
            .execute()
        return {"codes": res.data or []}
    except Exception as e:
        logger.error(f"list_codes failed: {e}")
        raise HTTPException(status_code=500, detail={"error": True, "message": "Could not fetch codes"})

@router.get("/creators")
async def list_creators(admin=Depends(require_admin)):
    res = supabase.table("creators")\
        .select("*, referrals(count)")\
        .order("created_at", desc=True).execute()
    return {"creators": res.data or []}

@router.post("/creators")
async def create_creator(payload: dict, admin=Depends(require_admin)):
    try:
        import hashlib
        password = payload.pop("password", "")
        password_hash = hashlib.sha256(password.encode()).hexdigest()

        creator_res = supabase.table("creators").insert({
            "name": payload["name"],
            "email": payload["email"].lower(),
            "handle": payload.get("handle", ""),
            "promo_code": payload["promo_code"].upper(),
            "ref_slug": payload["ref_slug"].lower(),
            "commission_rate": payload.get("commission_rate", 30),
            "user_discount": payload.get("user_discount", 20),
            "bonus_messages": payload.get("bonus_messages", 10),
            "payout_info": payload.get("payout_info", ""),
        }).execute()

        creator_id = creator_res.data[0]["id"]

        supabase.table("creator_accounts").insert({
            "creator_id": creator_id,
            "password_hash": password_hash,
        }).execute()

        return {"success": True, "creator": creator_res.data[0]}
    except Exception as e:
        logger.error(f"create_creator failed: {e}")
        raise HTTPException(status_code=500,
            detail={"error": True, "message": str(e)})

@router.patch("/creators/{creator_id}")
async def update_creator(
    creator_id: str, payload: dict, admin=Depends(require_admin)
):
    try:
        supabase.table("creators")\
            .update(payload)\
            .eq("id", creator_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500,
            detail={"error": True, "message": str(e)})

@router.post("/creators/{creator_id}/payout")
async def mark_payout(
    creator_id: str, payload: dict, admin=Depends(require_admin)
):
    try:
        amount = payload.get("amount")

        # Get pending referral IDs
        refs = supabase.table("referrals")\
            .select("id")\
            .eq("creator_id", creator_id)\
            .eq("commission_status", "pending").execute()
        ref_ids = [r["id"] for r in (refs.data or [])]

        # Mark referrals as paid
        supabase.table("referrals")\
            .update({"commission_status": "paid"})\
            .eq("creator_id", creator_id)\
            .eq("commission_status", "pending").execute()

        # Update creator total_paid
        creator = supabase.table("creators")\
            .select("total_paid").eq("id", creator_id)\
            .limit(1).execute()
        current_paid = (creator.data or [{}])[0].get("total_paid") or 0

        supabase.table("creators")\
            .update({"total_paid": current_paid + amount})\
            .eq("id", creator_id).execute()

        # Log payout
        supabase.table("creator_payouts").insert({
            "creator_id": creator_id,
            "amount": amount,
            "referral_ids": ref_ids,
            "notes": payload.get("notes", ""),
        }).execute()

        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500,
            detail={"error": True, "message": str(e)})
