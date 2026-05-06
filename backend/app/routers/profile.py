import logging
from fastapi import APIRouter, Depends, HTTPException
from app.middleware.auth import get_current_user
from app.services.supabase_client import supabase
from app.models.profile import IntakeRequest
from app.models.schemas import UpdateProfileRequest, UpdateTherapistSettingsRequest, UpdateIntakeAnswerRequest
from datetime import datetime

logger = logging.getLogger("sol")
router = APIRouter(prefix="/profile", tags=["profile"])

@router.post("/intake")
async def save_intake(payload: dict, user=Depends(get_current_user)):
    try:
        responses = payload.get("responses", {})
        personality_profile = payload.get("personality_profile", {})

        # Upsert intake responses
        existing = supabase.table("intake_responses")\
            .select("id")\
            .eq("user_id", user.id)\
            .limit(1).execute()

        if existing.data:
            supabase.table("intake_responses")\
                .update({
                    "responses": responses,
                    "personality_profile": personality_profile,
                })\
                .eq("user_id", user.id).execute()
        else:
            supabase.table("intake_responses").insert({
                "user_id": user.id,
                "responses": responses,
                "personality_profile": personality_profile,
            }).execute()

        # Mark onboarding complete
        supabase.table("profiles")\
            .update({"onboarding_completed": True})\
            .eq("id", user.id).execute()

        logger.info(f"Intake saved for user {user.id}")

        # Discord signup notification (non-blocking)
        try:
            import asyncio
            from app.services.discord import notify_new_signup
            name_res = supabase.table("profiles")\
                .select("preferred_name, full_name")\
                .eq("id", user.id).limit(1).execute()
            p = (name_res.data or [{}])[0]
            user_name = p.get("preferred_name") or p.get("full_name") or "New user"
            total_res = supabase.table("profiles")\
                .select("id", count="exact").execute()
            total_users = total_res.count or 0
            asyncio.create_task(notify_new_signup(user_name, total_users))
        except Exception:
            pass  # never crash for a Discord ping

        return {"success": True}

    except Exception as e:
        logger.error(f"save_intake failed for user {user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"error": True, "message": "Could not save intake responses"}
        )

@router.get("/me")
def get_profile(user=Depends(get_current_user)):
    try:
        # Try to get existing profile
        res = supabase.table("profiles")\
            .select("*")\
            .eq("id", user.id)\
            .limit(1).execute()

        if hasattr(res, 'data') and res.data and len(res.data) > 0:
            profile = res.data[0]
        else:
            # Auto-create profile on first login (use upsert to be safe against race conditions)
            logger.info(f"Auto-creating profile for user {user.id}")
            metadata = user.user_metadata if hasattr(user, 'user_metadata') and user.user_metadata else {}
            new_profile = {
                "id": user.id,
                "full_name": metadata.get("full_name", ""),
                "onboarding_completed": False,
            }
            create_res = supabase.table("profiles")\
                .upsert(new_profile).execute()
            profile = create_res.data[0] if (hasattr(create_res, 'data') and create_res.data) else new_profile

        # Get intake responses separately
        intake_res = supabase.table("intake_responses")\
            .select("personality_profile, responses")\
            .eq("user_id", user.id)\
            .order("created_at", desc=True)\
            .limit(1).execute()

        if hasattr(intake_res, 'data') and intake_res.data:
            profile["personality_profile"] = intake_res.data[0].get("personality_profile")
            profile["intake_responses"] = intake_res.data[0].get("responses")

        return profile

    except Exception as e:
        logger.error(f"get_profile failed for user {user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"error": True, "message": "Could not load profile"}
        )

@router.patch("/update")
async def update_profile(payload: dict, user=Depends(get_current_user)):
    try:
        allowed_fields = [
            "preferred_name", "full_name", "life_phase",
            "life_goal", "current_situation", "persistent_context",
            "therapist_settings", "avatar_url"
        ]
        update_data = {k: v for k, v in payload.items() if k in allowed_fields}

        if not update_data:
            return {"success": True, "message": "Nothing to update"}

        supabase.table("profiles")\
            .update(update_data)\
            .eq("id", user.id).execute()

        return {"success": True}

    except Exception as e:
        logger.error(f"update_profile failed for user {user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"error": True, "message": "Could not update profile"}
        )

PRO_ONLY_TONES = [
  "Like a competitor",
  "Like an obsessive",
  "Like a builder",
  "Like an anchor",
]

@router.patch("/therapist-settings")
async def update_therapist_settings(payload: UpdateTherapistSettingsRequest, user=Depends(get_current_user)):
    try:
        requested_tone = payload.therapist_tone

        if requested_tone in PRO_ONLY_TONES:
            # Check if user is Pro or Early Member
            profile_res = supabase.table("profiles")\
                .select("is_early_member")\
                .eq("id", user.id).limit(1).execute()
            is_early = profile_res.data[0].get("is_early_member", False) if (hasattr(profile_res, 'data') and len(profile_res.data) > 0) else False

            from app.services.subscription_service import is_pro
            user_is_pro = await is_pro(user.id)

            if not user_is_pro and not is_early:
                raise HTTPException(
                    status_code=403,
                    detail={
                        "error": True,
                        "message": "This archetype is available for Pro members.",
                        "code": "PRO_REQUIRED"
                    }
                )

        # Merge existing settings if present
        profile_res = supabase.table("profiles").select("therapist_settings").eq("id", user.id).limit(1).execute()
        existing_settings = profile_res.data[0].get("therapist_settings") if hasattr(profile_res, 'data') and len(profile_res.data) > 0 else {}
        if existing_settings is None: existing_settings = {}
        
        new_settings = {k: v for k, v in payload.model_dump().items() if v is not None}
        merged = {**existing_settings, **new_settings}
        
        supabase.table("profiles").update({"therapist_settings": merged}).eq("id", user.id).execute()
        return {"status": "success", "therapist_settings": merged}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"update_therapist_settings failed for user {user.id}: {e}")
        raise HTTPException(status_code=500, detail={"error": True, "message": "Something went wrong. Please try again.", "code": "SERVER_ERROR"})

@router.patch("/intake-answer")
def update_intake_answer(payload: UpdateIntakeAnswerRequest, user=Depends(get_current_user)):
    try:
        intake_res = supabase.table("intake_responses").select("id, responses").eq("user_id", user.id).order("created_at", desc=True).limit(1).execute()
        if not hasattr(intake_res, 'data') or len(intake_res.data) == 0:
            raise HTTPException(status_code=404, detail="No intake responses found")
        
        record_id = intake_res.data[0]["id"]
        existing_responses = intake_res.data[0].get("responses", {})
        existing_responses[payload.question_id] = payload.new_answer
        
        supabase.table("intake_responses").update({"responses": existing_responses}).eq("id", record_id).execute()
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"update_intake_answer failed for user {user.id}: {e}")
        raise HTTPException(status_code=500, detail={"error": True, "message": "Something went wrong. Please try again.", "code": "SERVER_ERROR"})

@router.delete("/me")
def delete_account(user=Depends(get_current_user)):
    try:
        res = supabase.auth.admin.delete_user(user.id)
        return {"status": "success"}
    except Exception as e:
        logger.error(f"delete_account failed for user {user.id}: {e}")
        raise HTTPException(status_code=500, detail={"error": True, "message": "Something went wrong. Please try again.", "code": "SERVER_ERROR"})

@router.post("/redeem-code")
async def redeem_code(payload: dict, user=Depends(get_current_user)):
    try:
        code = payload.get("code", "").upper().strip()
        # Find code
        res = supabase.table("early_member_codes").select("*").eq("code", code).execute()
        codes = res.data or []
        if not codes:
            raise HTTPException(status_code=400, detail="Invalid code.")
            
        code_row = codes[0]
        if code_row.get("redeemed_by"):
            if code_row.get("redeemed_by") == user.id:
                return {"success": True, "message": "Already redeemed", "member_number": code_row["member_number"]}
            raise HTTPException(status_code=400, detail="Code already redeemed by someone else.")
            
        # Update code
        now_iso = datetime.utcnow().isoformat()
        supabase.table("early_member_codes").update({
            "redeemed_by": user.id,
            "redeemed_at": now_iso
        }).eq("id", code_row["id"]).execute()
        
        # Update user
        supabase.table("profiles").update({
            "is_early_member": True,
            "early_member_number": code_row["member_number"],
            "early_member_code_used": code,
            "early_member_granted_at": now_iso
        }).eq("id", user.id).execute()
        
        return {"success": True, "member_number": code_row["member_number"]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"redeem-code failed: {e}")
        raise HTTPException(status_code=500, detail="Could not redeem.")

@router.get("/feedback-status")
async def get_feedback_status():
    """Public — checks if feedback form is enabled."""
    try:
        res = supabase.table("app_settings")\
            .select("value")\
            .eq("key", "feedback_enabled")\
            .limit(1).execute()
        enabled = True
        if res.data:
            enabled = res.data[0]["value"] == True or \
                      res.data[0]["value"] == "true"
        return {"enabled": enabled}
    except Exception as e:
        logger.error(f"get_feedback_status failed: {e}")
        return {"enabled": True}  # fail open


@router.post("/feedback")
async def submit_feedback(
    payload: dict, user=Depends(get_current_user)
):
    try:
        # Check if feedback is enabled
        status_res = supabase.table("app_settings")\
            .select("value").eq("key", "feedback_enabled")\
            .limit(1).execute()
        if status_res.data:
            enabled = status_res.data[0]["value"]
            if enabled == False or enabled == "false":
                raise HTTPException(status_code=403, detail={
                    "error": True,
                    "message": "Feedback is currently disabled."
                })

        # Check: user can only submit once per 7 days
        from datetime import datetime, timedelta
        seven_days_ago = (
            datetime.utcnow() - timedelta(days=7)
        ).isoformat()

        recent = supabase.table("user_feedback")\
            .select("id")\
            .eq("user_id", user.id)\
            .gte("submitted_at", seven_days_ago)\
            .limit(1).execute()

        if recent.data:
            raise HTTPException(status_code=429, detail={
                "error": True,
                "message": "You've already shared feedback recently. "
                           "Come back in a few days."
            })

        supabase.table("user_feedback").insert({
            "user_id": user.id,
            "answers": payload.get("answers", {}),
            "mood_at_time": payload.get("mood_at_time"),
        }).execute()

        return {"success": True}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"submit_feedback failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={
            "error": True, "message": "Could not save feedback."
        })
