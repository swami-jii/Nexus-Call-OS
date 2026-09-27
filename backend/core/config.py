import os
from dotenv import load_dotenv

load_dotenv()

from pydantic import BaseModel


class Settings(BaseModel):
    PROJECT_NAME: str = "Create Call OS API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    def _resolve_default_db() -> str:
        import shutil
        base_parent = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
        new_data_dir = os.path.join(base_parent, "Create-Call-OS-DATA")
        old_data_dir = os.path.join(base_parent, "Nexus-Call-OS-DATA")
        
        new_create_db = os.path.join(new_data_dir, "create_call_dev.db")
        new_nexus_db = os.path.join(new_data_dir, "nexus_dev.db")
        old_create_db = os.path.join(old_data_dir, "create_call_dev.db")
        old_nexus_db = os.path.join(old_data_dir, "nexus_dev.db")

        # 1. If valid non-empty create_call_dev.db exists in new data dir, use it
        if os.path.exists(new_create_db) and os.path.getsize(new_create_db) > 1024:
            return new_create_db

        # 2. If new_nexus_db has data, sync it to new_create_db and use new_create_db
        if os.path.exists(new_nexus_db) and os.path.getsize(new_nexus_db) > 1024:
            try:
                shutil.copy2(new_nexus_db, new_create_db)
                return new_create_db
            except Exception:
                return new_nexus_db

        # 3. Fallbacks to old data dir if present
        if os.path.exists(old_create_db) and os.path.getsize(old_create_db) > 1024:
            return old_create_db
        if os.path.exists(old_nexus_db) and os.path.getsize(old_nexus_db) > 1024:
            return old_nexus_db

        if os.path.exists(new_data_dir):
            return new_create_db
        return new_create_db

    _raw_db = os.getenv("DATABASE_URL", "")
    if _raw_db and (_raw_db.startswith("sqlite://") or _raw_db.startswith("postgresql://")):
        DATABASE_URL: str = _raw_db
    else:
        DATABASE_URL: str = f"sqlite:///{_resolve_default_db()}"

    # JWT Auth (Session Signature Keys)
    JWT_SECRET: str = os.getenv(
        "JWT_SECRET", "CreateCallOS_super_secret_jwt_key_32_bytes_min_length_123456"
    )
    JWT_REFRESH_SECRET: str = os.getenv(
        "JWT_REFRESH_SECRET", "CreateCallOS_refresh_super_secret_key_987654321"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["*"]

    # SMTP Email Configuration for Live Verification Delivery
    SMTP_HOST: str | None = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int | None = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str | None = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str | None = os.getenv("SMTP_PASSWORD", "")
    EMAILS_FROM_EMAIL: str | None = os.getenv("EMAILS_FROM_EMAIL", "")
    EMAILS_FROM_NAME: str | None = os.getenv("EMAILS_FROM_NAME", "CreateCall OS Security")

    GOOGLE_CLIENT_ID: str | None = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str | None = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GITHUB_CLIENT_ID: str | None = os.getenv("GITHUB_CLIENT_ID", "")
    GITHUB_CLIENT_SECRET: str | None = os.getenv("GITHUB_CLIENT_SECRET", "")
    MICROSOFT_CLIENT_ID: str | None = os.getenv("MICROSOFT_CLIENT_ID", "")
    MICROSOFT_CLIENT_SECRET: str | None = os.getenv("MICROSOFT_CLIENT_SECRET", "")
    MICROSOFT_TENANT_ID: str = os.getenv("MICROSOFT_TENANT_ID", "common")
    APPLE_CLIENT_ID: str | None = os.getenv("APPLE_CLIENT_ID", "")
    APPLE_CLIENT_SECRET: str | None = os.getenv("APPLE_CLIENT_SECRET", "")
    APPLE_TEAM_ID: str | None = os.getenv("APPLE_TEAM_ID", "")
    APPLE_KEY_ID: str | None = os.getenv("APPLE_KEY_ID", "")
    DISCORD_CLIENT_ID: str | None = os.getenv("DISCORD_CLIENT_ID", "")
    DISCORD_CLIENT_SECRET: str | None = os.getenv("DISCORD_CLIENT_SECRET", "")
    OAUTH_REDIRECT_BASE_URL: str | None = os.getenv("OAUTH_REDIRECT_BASE_URL", "")
    FRONTEND_BASE_URL: str | None = os.getenv("FRONTEND_BASE_URL", "")
    WEBHOOK_SECRET: str | None = os.getenv(
        "WEBHOOK_SECRET", "whsec_createcall_default_secret_998877"
    )


settings = Settings()
