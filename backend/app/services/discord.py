import httpx
import logging
from datetime import datetime
from app.config import settings

logger = logging.getLogger("sol")


async def send_discord_notification(
    title: str,
    description: str,
    color: int = 0xC96B2E,  # Sol amber
    fields: list = None
):
    """
    Send an embed notification to the Sol Discord channel.
    color is a hex integer: 0xC96B2E = Sol amber, 0x3D7A5F = green
    """
    if not settings.discord_webhook_url:
        logger.warning("Discord webhook not configured")
        return

    embed = {
        "title": title,
        "description": description,
        "color": color,
        "timestamp": datetime.utcnow().isoformat(),
        "footer": {
            "text": "Sol · talktosol.online"
        },
    }

    if fields:
        embed["fields"] = [
            {
                "name": f["name"],
                "value": str(f["value"]),
                "inline": f.get("inline", True),
            }
            for f in fields
        ]

    payload = {"embeds": [embed]}

    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                settings.discord_webhook_url,
                json=payload,
                timeout=5.0
            )
            if res.status_code not in (200, 204):
                logger.warning(
                    f"Discord webhook returned {res.status_code}"
                )
    except Exception as e:
        # Never crash the payment flow for a Discord notification
        logger.error(f"Discord notification failed: {e}")


async def notify_new_subscription(
    user_name: str,
    plan: str,
    amount: int,
    currency: str = "USD",
    country: str = "US",
    total_pro_users: int = 0,
    via_referral: bool = False,
    creator_name: str = None,
):
    symbol = "₹" if currency == "INR" else "$"
    amount_display = f"{symbol}{amount / 100:.0f}"

    plan_label = "Pro Yearly 🗓️" if "year" in plan.lower() \
                 else "Pro Monthly 📅"
    ref_note = f" via {creator_name}" if via_referral \
               and creator_name else ""
    flag = "🇮🇳" if country == "IN" else "🌍"

    await send_discord_notification(
        title=f"💰 New Subscription! {flag}",
        description=(
            f"**{user_name}** just upgraded to **{plan_label}**"
            f"{ref_note}"
        ),
        color=0x3D7A5F,
        fields=[
            {
                "name": "Amount",
                "value": amount_display,
                "inline": True,
            },
            {
                "name": "Country",
                "value": country,
                "inline": True,
            },
            {
                "name": "Total Pro",
                "value": str(total_pro_users),
                "inline": True,
            },
        ]
    )


async def notify_new_signup(user_name: str, total_users: int):
    """Ping on every new signup — optional, can disable if noisy."""
    await send_discord_notification(
        title="👋 New User",
        description=f"**{user_name}** just signed up",
        color=0xC96B2E,  # Sol amber
        fields=[
            {
                "name": "Total Users",
                "value": str(total_users),
                "inline": True,
            },
        ]
    )


async def notify_crisis_flag(user_id: str, severity: str):
    """
    Ping when a crisis is detected.
    user_id is anonymised — no personal info.
    """
    await send_discord_notification(
        title=f"⚠️ Crisis Flag — {severity.upper()}",
        description=(
            "A user triggered the crisis detection system. "
            "Sol provided crisis resources automatically."
        ),
        color=0xE74C3C,  # red
        fields=[
            {
                "name": "Severity",
                "value": severity,
                "inline": True,
            },
            {
                "name": "Anonymised ID",
                "value": user_id[-8:],  # last 8 chars only
                "inline": True,
            },
        ]
    )
