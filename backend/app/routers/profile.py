import logging
from fastapi import APIRouter, Depends, HTTPException
from app.middleware.auth import get_current_user
from app.services.supabase_client import supabase
from app.models.profile import IntakeRequest
from app.models.schemas import UpdateProfileRequest, UpdateTherapistSettingsRequest, UpdateIntakeAnswerRequest

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

@router.patch("/therapist-settings")
def update_therapist_settings(payload: UpdateTherapistSettingsRequest, user=Depends(get_current_user)):
    # Merge existing settings if present
    try:
        profile_res = supabase.table("profiles").select("therapist_settings").eq("id", user.id).limit(1).execute()
        existing_settings = profile_res.data[0].get("therapist_settings") if hasattr(profile_res, 'data') and len(profile_res.data) > 0 else {}
        if existing_settings is None: existing_settings = {}
        
        new_settings = {k: v for k, v in payload.model_dump().items() if v is not None}
        merged = {**existing_settings, **new_settings}
        
        supabase.table("profiles").update({"therapist_settings": merged}).eq("id", user.id).execute()
        return {"status": "success", "therapist_settings": merged}
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
