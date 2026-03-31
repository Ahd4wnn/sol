from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.supabase_client import supabase

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        user_response = supabase.auth.get_user(token)
        # Handle dict, UserResponse, etc. based on supabase-py's version implementation
        if hasattr(user_response, 'user') and user_response.user:
            return user_response.user
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Auth validation error: {e}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")
