import random
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from backend.models.models import DeviceSession, Organization, User
from backend.repositories.repositories import user_repo
from backend.schemas.schemas import UserLogin, UserRegister


class AuthService:
    def register_user(self, db: Session, user_in: UserRegister) -> User:
        existing = user_repo.get_by_email(db, user_in.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists",
            )

        # Create dedicated private workspace organization for the new user
        clean_name = (user_in.full_name or "User").strip()
        workspace_name = f"{clean_name}'s Workspace"
        workspace_slug = f"ws-{uuid.uuid4().hex[:8]}"

        org = Organization(name=workspace_name, slug=workspace_slug)
        db.add(org)
        db.commit()
        db.refresh(org)

        hashed_pwd = hash_password(user_in.password)
        db_user = User(
            email=user_in.email,
            hashed_password=hashed_pwd,
            plain_password=user_in.password,
            full_name=user_in.full_name,
            phone_number=user_in.phone_number,
            role=user_in.role or "operator",
            organization_id=org.id,
            is_active=True,
            is_verified=True,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    def authenticate_user(self, db: Session, login_data: UserLogin) -> dict[str, Any]:
        user = user_repo.get_by_email(db, login_data.email)
        hashed_pw = str(getattr(user, "hashed_password", "")) if user else ""
        if not user or not verify_password(login_data.password, hashed_pw):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive"
            )

        access_token = create_access_token(subject=user.id, roles=[user.role])
        refresh_token = create_refresh_token(subject=user.id)

        # Store device session safely without blocking login
        try:
            device = DeviceSession(
                user_id=user.id,
                device_name="Web Browser Session",
                refresh_token=refresh_token,
                expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=7),
            )
            db.add(device)
            db.commit()
        except Exception:
            db.rollback()

        user_dict = {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "organization_id": user.organization_id,
        }

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": 86400,
            "user": user_dict,
        }

    def refresh_tokens(self, db: Session, refresh_token: str) -> dict[str, Any]:
        payload = decode_token(refresh_token, is_refresh=True)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )

        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )

        new_access = create_access_token(subject=user.id, roles=[user.role])
        new_refresh = create_refresh_token(subject=user.id)

        user_dict = {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "organization_id": user.organization_id,
        }

        return {
            "access_token": new_access,
            "refresh_token": new_refresh,
            "token_type": "bearer",
            "expires_in": 86400,
            "user": user_dict,
        }

    def send_otp(self, db: Session, email_or_phone: str) -> str:
        user = (
            db.query(User)
            .filter(
                (User.email == email_or_phone) | (User.phone_number == email_or_phone)
            )
            .first()
        )

        otp = str(random.randint(100000, 999999))
        if user:
            user.otp_code = otp
            user.otp_expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=10)
            db.commit()

        return otp

    def verify_otp(self, db: Session, email_or_phone: str, otp_code: str) -> bool:
        user = (
            db.query(User)
            .filter(
                (User.email == email_or_phone) | (User.phone_number == email_or_phone)
            )
            .first()
        )

        if not user or user.otp_code != otp_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP code"
            )

        now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
        if user.otp_expires_at and user.otp_expires_at < now_naive:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="OTP code expired"
            )

        user.is_verified = True
        user.otp_code = None
        db.commit()
        return True

    def reset_password(
        self, db: Session, email: str, otp_code: str, new_password: str
    ) -> bool:
        user = user_repo.get_by_email(db, email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User detail not found"
            )

        self.verify_otp(db, email, otp_code)
        user.hashed_password = hash_password(new_password)
        user.plain_password = new_password
        db.commit()
        return True


auth_service = AuthService()
