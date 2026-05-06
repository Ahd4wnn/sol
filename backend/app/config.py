from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str
    supabase_service_key: str
    openai_api_key: str
    frontend_url: str
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    admin_email: str = ""
    vapid_private_key: str = ""
    vapid_public_key: str = ""
    vapid_claims_email: str = ""
    cron_secret: str = ""
    discord_webhook_url: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
