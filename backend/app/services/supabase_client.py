import logging
from supabase import create_client, Client
from app.config import settings

logger = logging.getLogger("sol.supabase")

try:
  supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_key
  )
  logger.info("Supabase client initialized successfully")
except Exception as e:
  logger.critical(f"FATAL: Could not initialize Supabase client: {e}")
  raise
