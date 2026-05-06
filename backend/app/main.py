import logging
import time
from fastapi import FastAPI, Request, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.config import settings
from app.limiter import limiter
from app.routers import auth, sessions, profile, agent, memory, messages, admin, billing, push, notifications, creators
from app.services.supabase_client import supabase

logging.basicConfig(
  level=logging.INFO,
  format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger("sol")

app = FastAPI(title="Sol API", version="1.0.0")

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
  CORSMiddleware,
  allow_origins=[
      settings.frontend_url, 
      "http://localhost:5173", 
      "https://www.talktosol.online", 
      "https://talktosol.online",
      "https://sol-4y64.vercel.app"
  ],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=()"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Request timing middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
  start = time.time()
  logger.info(f"→ {request.method} {request.url.path}")
  try:
    response = await call_next(request)
    duration = (time.time() - start) * 1000
    if request.url.path != '/health':
        logger.info(f"← {request.method} {request.url.path} {response.status_code} ({duration:.0f}ms)")
    return response
  except Exception as e:
    logger.error(f"✗ {request.method} {request.url.path} CRASHED: {e}")
    raise

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(sessions.router)
api_router.include_router(profile.router)
api_router.include_router(agent.router)
api_router.include_router(memory.router)
api_router.include_router(messages.router)
api_router.include_router(admin.router)
api_router.include_router(billing.router)
api_router.include_router(push.router)
api_router.include_router(notifications.router)
api_router.include_router(creators.router)

app.include_router(api_router)

@app.get("/health")
async def health():
  try:
    result = supabase.table("profiles").select("id").limit(1).execute()
    db_status = "ok"
  except Exception as e:
    logger.error(f"Supabase health check failed: {e}")
    db_status = "error"
  
  return {
    "status": "ok",
    "service": "Sol API",
    "database": db_status,
    "timestamp": time.time()
  }

@app.on_event("startup")
async def startup():
  logger.info("━━━━━━━━━━━━━━━━━━━━━━━━")
  logger.info("  Sol API starting up...")
  logger.info(f"  Frontend URL: {settings.frontend_url}")
  logger.info(f"  Supabase: {settings.supabase_url[:30]}...")
  logger.info(f"  OpenAI: {'configured' if settings.openai_api_key else 'MISSING'}")
  logger.info("━━━━━━━━━━━━━━━━━━━━━━━━")
