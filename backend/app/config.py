from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str
    supabase_service_key: str
    openai_api_key: str
    frontend_url: str
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    admin_email: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
