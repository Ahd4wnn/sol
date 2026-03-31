from fastapi import APIRouter, Depends
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/agent", tags=["agent"])

@router.post("/chat")
def chat(user=Depends(get_current_user)):
    return {"message": "Placeholder chat route", "user_id": user.id}
