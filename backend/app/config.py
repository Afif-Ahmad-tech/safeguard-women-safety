from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    redis_url: str = "redis://localhost:6379"
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""
    firebase_credentials_path: str = ""
    smtp_email: str = ""
    smtp_password: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
