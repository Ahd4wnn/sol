import logging
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from app.middleware.auth import get_current_user
from app.services.supabase_client import supabase
from app.models.schemas import CreateSessionRequest, UpdateSessionRequest
from app.services.summarizer import summarize_session

logger = logging.getLogger("sol")
router = APIRouter(prefix="/sessions", tags=["sessions"])

@router.post("/create")
async def create_session(payload: CreateSessionRequest, user=Depends(get_current_user)):
    try:
        supabase.table("profiles").upsert({"id": user.id}).execute()

        # Check subscription
        from app.services.subscription_service import is_pro
        user_is_pro = await is_pro(user.id)

        # Check early member
        profile_res = supabase.table("profiles")\
            .select("is_early_member")\
            .eq("id", user.id).limit(1).execute()
        profile = (profile_res.data or [{}])[0]
        is_early = profile.get("is_early_member", False)

        # Free users: max 1 session
        if not user_is_pro and not is_early:
            session_count_res = supabase.table("therapy_sessions")\
                .select("id", count="exact")\
                .eq("user_id", user.id)\
                .is_("deleted_at", "null")\
                .execute()
            session_count = session_count_res.count or 0

            if session_count >= 1:
                raise HTTPException(
                    status_code=403,
                    detail={
                        "error": True,
                        "code": "SESSION_LIMIT_REACHED",
                        "message": "Free plan includes 1 session.",
                        "upgrade_required": True,
                    }
                )

        data = {
            "user_id": user.id,
            "title": payload.title,
            "mood_before": payload.mood_before,
            "mood_word": payload.mood_word,
            "opening_context": payload.opening_context
        }
        res = supabase.table("therapy_sessions").insert(data).execute()
        return res.data[0] if (hasattr(res, 'data') and len(res.data) > 0) else None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"create_session failed for user {user.id}: {e}")
        raise HTTPException(status_code=500, detail={"error": True, "message": "Something went wrong. Please try again.", "code": "SERVER_ERROR"})

@router.get("/list")
def list_sessions(user=Depends(get_current_user)):
    try:
        res = supabase.table("therapy_sessions").select("*, messages(count)").eq("user_id", user.id).order("created_at", desc=True).execute()
        sessions = res.data if hasattr(res, 'data') else []
        for s in sessions:
            msgs = s.get('messages', [])
            s['message_count'] = msgs[0].get('count', 0) if isinstance(msgs, list) and len(msgs) > 0 else 0
        return sessions
    except Exception as e:
        logger.error(f"list_sessions failed for user {user.id}: {e}")
        raise HTTPException(status_code=500, detail={"error": True, "message": "Something went wrong. Please try again.", "code": "SERVER_ERROR"})

@router.get("/{session_id}")
def get_session(session_id: str, user=Depends(get_current_user)):
    try:
        session_res = supabase.table("therapy_sessions").select("*").eq("id", session_id).eq("user_id", user.id).limit(1).execute()
        if not hasattr(session_res, 'data') or len(session_res.data) == 0:
            raise HTTPException(status_code=403, detail={"error": True, "message": "Session not found or access denied"})
            
        session = session_res.data[0]
        msgs_res = supabase.table("messages").select("*").eq("session_id", session_id).order("created_at", desc=False).execute()
        session["messages"] = msgs_res.data if hasattr(msgs_res, 'data') else []
        
        return session
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"get_session failed for user {user.id}: {e}")
        raise HTTPException(status_code=500, detail={"error": True, "message": "Something went wrong. Please try again.", "code": "SERVER_ERROR"})

@router.patch("/{session_id}")
def update_session(session_id: str, payload: UpdateSessionRequest, background_tasks: BackgroundTasks, user=Depends(get_current_user)):
    try:
        check_res = supabase.table("therapy_sessions").select("id").eq("id", session_id).eq("user_id", user.id).limit(1).execute()
        if not hasattr(check_res, 'data') or len(check_res.data) == 0:
            raise HTTPException(status_code=403, detail={"error": True, "message": "Access denied"})
            
        update_data = {}
        if payload.title is not None: update_data["title"] = payload.title
        if payload.mood_after is not None: update_data["mood_after"] = payload.mood_after
        if payload.summary is not None: update_data["summary"] = payload.summary
            
        if update_data:
            supabase.table("therapy_sessions").update(update_data).eq("id", session_id).execute()
            
        if payload.mood_after is not None and payload.summary is None:
            background_tasks.add_task(summarize_session, session_id, user.id)
            
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"update_session failed for user {user.id}: {e}")
        raise HTTPException(status_code=500, detail={"error": True, "message": "Something went wrong. Please try again.", "code": "SERVER_ERROR"})

@router.delete("/{session_id}")
async def delete_session(session_id: str, user=Depends(get_current_user)):
    try:
        # Verify ownership
        res = supabase.table("therapy_sessions")\
            .select("id")\
            .eq("id", session_id)\
            .eq("user_id", user.id)\
            .limit(1).execute()

        if not res.data:
            raise HTTPException(
                status_code=404,
                detail={"error": True,
                        "message": "Session not found"}
            )

        # Nullify memory_notes FK reference (don't delete memories)
        supabase.table("memory_notes")\
            .update({"source_session_id": None})\
            .eq("source_session_id", session_id).execute()

        # Delete messages (foreign key)
        supabase.table("messages")\
            .delete()\
            .eq("session_id", session_id).execute()

        # Delete the session
        supabase.table("therapy_sessions")\
            .delete()\
            .eq("id", session_id)\
            .eq("user_id", user.id).execute()

        logger.info(
            f"Session {session_id} deleted by user {user.id}"
        )
        return {"success": True}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"delete_session failed: {e}")
        raise HTTPException(
            status_code=500,
            detail={"error": True,
                    "message": "Could not delete session"}
        )
