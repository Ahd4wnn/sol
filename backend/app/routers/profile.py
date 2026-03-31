import logging
from fastapi import APIRouter, Depends, HTTPException
from app.middleware.auth import get_current_user
from app.services.supabase_client import supabase
from app.models.profile import IntakeRequest
from app.models.schemas import UpdateProfileRequest, UpdateTherapistSettingsRequest, UpdateIntakeAnswerRequest

logger = logging.getLogger("sol")
router = APIRouter(prefix="/profile", tags=["profile"])

@router.post("/intake")
def save_intake(payload: IntakeRequest, user=Depends(get_current_user)):
    user_id = user.id
    
    try:
        # Save to intake_responses
        intake_data = {
            "user_id": user_id,
            "responses": payload.responses,
            "personality_profile": payload.personality_profile.model_dump()
        }
        supabase.table("intake_responses").insert(intake_data).execute()
        
        # Update user profile
        supabase.table("profiles").update({"onboarding_completed": True}).eq("id", user_id).execute()
        
        return {"status": "success", "message": "Intake completed successfully"}
    except Exception as e:
        logger.error(f"save_intake failed for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail={"error": True, "message": "Something went wrong. Please try again.", "code": "SERVER_ERROR"})

@router.get("/me")
def get_me(user=Depends(get_current_user)):
    user_id = user.id
    try:
        # Upsert profile to ensure it exists (acting as the trigger)
        supabase.table("profiles").upsert({"id": user_id}).execute()
        
        # Fetch profile
        profile_res = supabase.table("profiles").select("*").eq("id", user_id).limit(1).execute()
        
        profile_data = profile_res.data[0] if (hasattr(profile_res, 'data') and len(profile_res.data) > 0) else None
        if not profile_data:
            return {"profile": None, "personality_profile": None}
            
        # Fetch personality profile if available
        intake_res = supabase.table("intake_responses").select("personality_profile, responses").eq("user_id", user_id).order("created_at", desc=True).limit(1).execute()
        intake_data = intake_res.data[0] if (hasattr(intake_res, 'data') and len(intake_res.data) > 0) else None
        
        res_payload = {
            "profile": profile_data,
            "personality_profile": intake_data.get("personality_profile") if intake_data else None,
            "intake_responses": intake_data.get("responses") if intake_data else None
        }
        return res_payload
    except Exception as e:
        logger.error(f"get_me failed for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail={"error": True, "message": "Something went wrong. Please try again.", "code": "SERVER_ERROR"})

@router.patch("/update")
def update_profile(payload: UpdateProfileRequest, user=Depends(get_current_user)):
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        return {"status": "success"}
    try:
        supabase.table("profiles").update(update_data).eq("id", user.id).execute()
        return {"status": "success"}
    except Exception as e:
        logger.error(f"update_profile failed for user {user.id}: {e}")
        raise HTTPException(status_code=500, detail={"error": True, "message": "Something went wrong. Please try again.", "code": "SERVER_ERROR"})

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
