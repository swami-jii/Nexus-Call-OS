import os
from dotenv import load_dotenv

load_dotenv()

from pydantic import BaseModel


class Settings(BaseModel):
    PROJECT_NAME: str = "Nexus AI Voice OS API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    _default_db = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "Nexus-Call-OS-DATA", "nexus_dev.db")
    )
    _raw_db = os.getenv("DATABASE_URL", "")
    if _raw_db and (_raw_db.startswith("sqlite://") or _raw_db.startswith("postgresql://")):
        DATABASE_URL: str = _raw_db
    else:
        DATABASE_URL: str = f"sqlite:///{_default_db}"

    # JWT Auth
    JWT_SECRET: str = os.getenv(
        "JWT_SECRET", "nexus_super_secret_jwt_key_32_bytes_min_length_123456"
    )
    JWT_REFRESH_SECRET: str = os.getenv(
        "JWT_REFRESH_SECRET", "nexus_refresh_super_secret_key_987654321"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["*"]

    # Environment Keys
    SMTP_HOST: str | None = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int | None = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str | None = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str | None = os.getenv("SMTP_PASSWORD", "")

    TWILIO_ACCOUNT_SID: str | None = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str | None = os.getenv("TWILIO_AUTH_TOKEN", "")

    ELEVENLABS_API_KEY: str | None = os.getenv("ELEVENLABS_API_KEY", "")
    GEMINI_API_KEY: str | None = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY", "")
    DEEPGRAM_API_KEY: str | None = os.getenv("DEEPGRAM_API_KEY", "")
    GOOGLE_CLIENT_ID: str | None = os.getenv("GOOGLE_CLIENT_ID", "")
    WEBHOOK_SECRET: str | None = os.getenv(
        "WEBHOOK_SECRET", "whsec_default_nexus_secret_998877"
    )


settings = Settings()
