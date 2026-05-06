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
from dateutil.relativedelta import relativedelta

logger = logging.getLogger("sol")
router = APIRouter(prefix="/billing", tags=["billing"])


# ── Valid plan IDs ──
VALID_PLANS = ["pro_1month", "pro_3month", "pro_6month", "pro_12month"]

# ── Plan durations ──
PLAN_DURATIONS = {
    "pro_1month":  {"months": 1},
    "pro_3month":  {"months": 3},
    "pro_6month":  {"months": 6},
    "pro_12month": {"months": 12},
}


def get_expiry_date(plan_id: str) -> str:
    duration = PLAN_DURATIONS.get(plan_id, {"months": 1})
    expiry = datetime.utcnow() + relativedelta(months=duration["months"])
    return expiry.isoformat()


# ── Location-based pricing ──

def get_user_country(request: Request) -> str:
    """
    Detect user country from Vercel/Cloudflare headers.
    Falls back to "US" if not detectable.
    """
    country = request.headers.get("x-vercel-ip-country", "")
    if not country:
        country = request.headers.get("cf-ipcountry", "")
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
                "pro_1month": {
                    "id": "pro_1month",
                    "label": "1 Month",
                    "original_amount": 124900,
                    "amount": 83900,
                    "original_display": "1,249",
                    "amount_display": "839",
                    "period": "month",
                    "period_count": 1,
                    "razorpay_currency": "INR",
                    "savings": None,
                    "badge": None,
                },
                "pro_3month": {
                    "id": "pro_3month",
                    "label": "3 Months",
                    "original_amount": 249900,
                    "amount": 166900,
                    "original_display": "2,499",
                    "amount_display": "1,669",
                    "period": "3 months",
                    "period_count": 3,
                    "razorpay_currency": "INR",
                    "savings": "Save ₹830",
                    "badge": None,
                },
                "pro_6month": {
                    "id": "pro_6month",
                    "label": "6 Months",
                    "original_amount": 584900,
                    "amount": 332900,
                    "original_display": "5,849",
                    "amount_display": "3,329",
                    "period": "6 months",
                    "period_count": 6,
                    "razorpay_currency": "INR",
                    "savings": "Save ₹2,520",
                    "badge": "Most Popular",
                },
                "pro_12month": {
                    "id": "pro_12month",
                    "label": "12 Months",
                    "original_amount": 1079900,
                    "amount": 724900,
                    "original_display": "10,799",
                    "amount_display": "7,249",
                    "period": "year",
                    "period_count": 12,
                    "razorpay_currency": "INR",
                    "savings": "Save ₹3,550",
                    "badge": "Best Value",
                },
            }
        }
    else:
        return {
            "currency": "USD",
            "currency_symbol": "$",
            "locale": "en-US",
            "plans": {
                "pro_1month": {
                    "id": "pro_1month",
                    "label": "1 Month",
                    "original_amount": 1499,
                    "amount": 999,
                    "original_display": "14.99",
                    "amount_display": "9.99",
                    "period": "month",
                    "period_count": 1,
                    "razorpay_currency": "USD",
                    "savings": None,
                    "badge": None,
                },
                "pro_3month": {
                    "id": "pro_3month",
                    "label": "3 Months",
                    "original_amount": 2999,
                    "amount": 1999,
                    "original_display": "29.99",
                    "amount_display": "19.99",
                    "period": "3 months",
                    "period_count": 3,
                    "razorpay_currency": "USD",
                    "savings": "Save $10",
                    "badge": None,
                },
                "pro_6month": {
                    "id": "pro_6month",
                    "label": "6 Months",
                    "original_amount": 6999,
                    "amount": 3999,
                    "original_display": "69.99",
                    "amount_display": "39.99",
                    "period": "6 months",
                    "period_count": 6,
                    "razorpay_currency": "USD",
                    "savings": "Save $30",
                    "badge": "Most Popular",
                },
                "pro_12month": {
                    "id": "pro_12month",
                    "label": "12 Months",
                    "original_amount": 12999,
                    "amount": 8699,
                    "original_display": "129.99",
                    "amount_display": "86.99",
                    "period": "year",
                    "period_count": 12,
                    "razorpay_currency": "USD",
                    "savings": "Save $43",
                    "badge": "Best Value",
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

        plan_val = sub.get("plan", "free")
        is_pro = plan_val.startswith("pro_") and plan_val != "free" \
                 and sub.get("status") in ("active", "gifted")

        return {
            "plan": plan_val,
            "status": sub.get("status", "active"),
            "messages_used": count,
            "messages_limit": 10,
            "is_pro": is_pro,
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
        if plan_id not in VALID_PLANS:
            raise HTTPException(status_code=400, detail={"error": True, "message": "Invalid plan"})

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
        raise HTTPException(status_code=500, detail={"error": True, "message": "Could not create order"})


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

        # Activate subscription with correct duration
        now = datetime.utcnow()
        expiry_date = get_expiry_date(plan_id)

        supabase.table("subscriptions").upsert({
            "user_id": user.id,
            "plan": plan_id,
            "status": "active",
            "razorpay_subscription_id": payment_id,
            "current_period_start": now.isoformat(),
            "current_period_end": expiry_date,
            "updated_at": now.isoformat()
        }, on_conflict="user_id").execute()

        logger.info(f"Subscription activated: user={user.id} plan={plan_id} expires={expiry_date}")

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
