import logging
from fastapi import APIRouter, Depends, HTTPException
from app.middleware.auth import get_current_user
from app.services.supabase_client import supabase
from app.models.schemas import AddMemoryNoteRequest

logger = logging.getLogger("sol")
router = APIRouter(prefix="/memory", tags=["memory"])

@router.get("/notes")
def get_memory_notes(user=Depends(get_current_user)):
    try:
        res = supabase.table("memory_notes").select("*").eq("user_id", user.id).order("created_at", desc=True).execute()
        return res.data if hasattr(res, 'data') else []
    except Exception as e:
        logger.error(f"get_memory_notes failed for user {user.id}: {e}")
        raise HTTPException(status_code=500, detail={"error": True, "message": "Something went wrong. Please try again.", "code": "SERVER_ERROR"})

@router.post("/notes")
def add_memory_note(payload: AddMemoryNoteRequest, user=Depends(get_current_user)):
    try:
        data = {
            "user_id": user.id,
            "note": payload.note,
            "tags": payload.tags
        }
        res = supabase.table("memory_notes").insert(data).execute()
        return res.data[0] if (hasattr(res, 'data') and len(res.data) > 0) else None
    except Exception as e:
        logger.error(f"add_memory_note failed for user {user.id}: {e}")
        raise HTTPException(status_code=500, detail={"error": True, "message": "Something went wrong. Please try again.", "code": "SERVER_ERROR"})

@router.delete("/notes/{note_id}")
def delete_memory_note(note_id: str, user=Depends(get_current_user)):
    try:
        supabase.table("memory_notes").delete().eq("id", note_id).eq("user_id", user.id).execute()
        return {"status": "success"}
    except Exception as e:
        logger.error(f"delete_memory_note failed for user {user.id}: {e}")
        raise HTTPException(status_code=500, detail={"error": True, "message": "Something went wrong. Please try again.", "code": "SERVER_ERROR"})
