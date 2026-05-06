import razorpay
import hmac
import hashlib
import json
import asyncio
from fastapi import APIRouter, Depends, HTTPException, Request
from app.limiter import limiter
from app.middleware.auth import get_current_user
from app.services.supabase_client import supabase
from app.services.subscription_service import get_subscription
from app.config import settings
import logging
from datetime import datetime, timedelta

logger = logging.getLogger("sol")
router = APIRouter(prefix="/billing", tags=["billing"])


# ── Location-based pricing ──

def get_user_country(request: Request) -> str:
    """
    Detect user country from Vercel/Cloudflare headers.
    Falls back to "US" if not detectable.
    """
    # Vercel sets this automatically on all requests
    country = request.headers.get("x-vercel-ip-country", "")

    # Cloudflare (if using Cloudflare proxy)
    if not country:
        country = request.headers.get("cf-ipcountry", "")

    # Railway/Render sometimes forward this
    if not country:
        country = request.headers.get("x-country-code", "")

    return country.upper().strip() or "US"


def get_pricing(country: str) -> dict:
    """
    Returns pricing config based on country.
    India gets INR pricing, everyone else gets USD.
    """
    if country == "IN":
        return {
            "currency": "INR",
            "currency_symbol": "₹",
            "locale": "en-IN",
            "plans": {
                "pro_monthly": {
                    "id": "pro_monthly",
                    "label": "Pro Monthly",
                    "amount": 39900,        # paise (₹399)
                    "amount_display": "399",
                    "period": "month",
                    "razorpay_currency": "INR",
                    "savings": None,
                },
                "pro_yearly": {
                    "id": "pro_yearly",
                    "label": "Pro Yearly",
                    "amount": 399900,       # paise (₹3,999)
                    "amount_display": "3,999",
                    "period": "year",
                    "razorpay_currency": "INR",
                    "savings": "Save ₹789",
                },
            }
        }
    else:
        return {
            "currency": "USD",
            "currency_symbol": "$",
            "locale": "en-US",
            "plans": {
                "pro_monthly": {
                    "id": "pro_monthly",
                    "label": "Pro Monthly",
                    "amount": 1000,         # cents ($10)
                    "amount_display": "10",
                    "period": "month",
                    "razorpay_currency": "USD",
                    "savings": None,
                },
                "pro_yearly": {
                    "id": "pro_yearly",
                    "label": "Pro Yearly",
                    "amount": 8900,         # cents ($89)
                    "amount_display": "89",
                    "period": "year",
                    "razorpay_currency": "USD",
                    "savings": "Save $31",
                },
            }
        }


def get_razorpay_client():
    return razorpay.Client(
        auth=(settings.razorpay_key_id, settings.razorpay_key_secret)
    )


# ── Endpoints ──

@router.get("/pricing")
async def get_pricing_public(request: Request):
    """Public endpoint — no auth required. Used by landing page."""
    country = get_user_country(request)
    pricing = get_pricing(country)
    return {
        "country": country,
        "currency": pricing["currency"],
        "currency_symbol": pricing["currency_symbol"],
        "plans": pricing["plans"],
    }


@router.get("/status")
async def get_billing_status(request: Request, user=Depends(get_current_user)):
    """Returns current subscription + message count + pricing for the frontend."""
    try:
        from app.services.subscription_service import get_message_count
        sub = await get_subscription(user.id)
        count = await get_message_count(user.id)

        country = get_user_country(request)
        pricing = get_pricing(country)

        return {
            "plan": sub.get("plan", "free"),
            "status": sub.get("status", "active"),
            "messages_used": count,
            "messages_limit": 10,
            "is_pro": sub.get("plan") in ("pro_monthly", "pro_yearly")
                      and sub.get("status") in ("active", "gifted"),
            "period_end": sub.get("current_period_end"),
            "country": country,
            "currency": pricing["currency"],
            "currency_symbol": pricing["currency_symbol"],
            "plans": pricing["plans"],
        }
    except Exception as e:
        logger.error(f"get_billing_status failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": True, "message": "Could not fetch billing status"})


@router.post("/create-order")
@limiter.limit("10/minute")
async def create_order(request: Request, payload: dict, user=Depends(get_current_user)):
    """Creates a Razorpay order — price determined server-side by geo."""
    try:
        plan_id = payload.get("plan")
        if plan_id not in ("pro_monthly", "pro_yearly"):
            raise HTTPException(status_code=400, detail={"error": True, "message": "Invalid plan"})

        # Detect country SERVER-SIDE — never trust client
        country = get_user_country(request)
        pricing = get_pricing(country)
        plan = pricing["plans"][plan_id]

        final_amount = plan["amount"]
        client = get_razorpay_client()

        order = client.order.create({
            "amount": final_amount,
            "currency": plan["razorpay_currency"],
            "receipt": f"sol_{str(user.id)[:8]}_{plan_id}",
            "notes": {
                "user_id": str(user.id),
                "plan": str(plan_id),
                "country": country,
                "email": str(user.email) if user.email else ""
            }
        })

        logger.info(
            f"Order created: {plan_id} "
            f"{plan['razorpay_currency']} "
            f"{final_amount/100} "
            f"for user {user.id} "
            f"(country: {country})"
        )

        return {
            "order_id": order["id"],
            "amount": final_amount,
            "currency": plan["razorpay_currency"],
            "plan": plan_id,
            "description": f"Sol {plan['label']}",
            "amount_display": f"{pricing['currency_symbol']}{plan['amount_display']}",
            "key_id": settings.razorpay_key_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"create_order failed: {type(e).__name__}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": True, "message": f"Could not create order"})


@router.post("/verify-payment")
async def verify_payment(request: Request, payload: dict, user=Depends(get_current_user)):
    """Verifies Razorpay payment signature and activates subscription."""
    try:
        order_id = payload.get("razorpay_order_id")
        payment_id = payload.get("razorpay_payment_id")
        signature = payload.get("razorpay_signature")
        plan_id = payload.get("plan")

        # Verify signature
        expected = hmac.new(
            settings.razorpay_key_secret.encode(),
            f"{order_id}|{payment_id}".encode(),
            hashlib.sha256
        ).hexdigest()

        if expected != signature:
            raise HTTPException(
                status_code=400,
                detail={"error": True, "message": "Payment verification failed"}
            )

        # Activate subscription
        now = datetime.utcnow()
        period_end = now + timedelta(days=365 if plan_id == "pro_yearly" else 30)

        supabase.table("subscriptions").upsert({
            "user_id": user.id,
            "plan": plan_id,
            "status": "active",
            "razorpay_subscription_id": payment_id,
            "current_period_start": now.isoformat(),
            "current_period_end": period_end.isoformat(),
            "updated_at": now.isoformat()
        }, on_conflict="user_id").execute()

        logger.info(f"Subscription activated: user={user.id} plan={plan_id}")

        # Discord notification (non-blocking)
        country = get_user_country(request)
        pricing = get_pricing(country)
        plan_info = pricing["plans"].get(plan_id, {})

        try:
            from app.services.discord import notify_new_subscription
            profile_res = supabase.table("profiles")\
                .select("preferred_name, full_name")\
                .eq("id", user.id).limit(1).execute()
            p = (profile_res.data or [{}])[0]
            user_name = p.get("preferred_name") or p.get("full_name") or "Someone"

            pro_count_res = supabase.table("subscriptions")\
                .select("id", count="exact")\
                .in_("status", ["active", "gifted"]).execute()
            total_pro = pro_count_res.count or 0

            creator_name = None
            via_referral = False
            try:
                ref_check = supabase.table("referrals")\
                    .select("creators(name)")\
                    .eq("user_id", user.id)\
                    .eq("converted", True)\
                    .limit(1).execute()
                if ref_check.data:
                    via_referral = True
                    creator_name = ref_check.data[0].get("creators", {}).get("name")
            except Exception:
                pass

            asyncio.create_task(
                notify_new_subscription(
                    user_name=user_name,
                    plan=plan_id,
                    amount=plan_info.get("amount", 0),
                    currency=plan_info.get("razorpay_currency", "USD"),
                    country=country,
                    total_pro_users=total_pro,
                    via_referral=via_referral,
                    creator_name=creator_name,
                )
            )
        except Exception as discord_err:
            logger.error(f"Discord notify failed: {discord_err}")

        return {"success": True, "plan": plan_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"verify_payment failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": True, "message": "Payment verification failed"})


@router.post("/cancel")
async def cancel_subscription(user=Depends(get_current_user)):
    try:
        supabase.table("subscriptions")\
            .update({"status": "cancelled", "updated_at": datetime.utcnow().isoformat()})\
            .eq("user_id", user.id).execute()
        return {"success": True}
    except Exception as e:
        logger.error(f"cancel_subscription failed: {e}")
        raise HTTPException(status_code=500, detail={"error": True, "message": "Could not cancel"})
