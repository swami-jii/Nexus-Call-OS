from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.auth.deps import get_current_user
from backend.database.session import get_db
from backend.models.models import User
from backend.schemas.schemas import (
    ForgotPasswordRequest,
    OTPRequest,
    OTPVerifyRequest,
    RefreshTokenRequest,
    ResetPasswordRequest,
    Token,
    UserLogin,
    UserOut,
    UserRegister,
)
from backend.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    return auth_service.register_user(db, user_in)


@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    return auth_service.authenticate_user(db, login_data)


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Successfully logged out", "user_id": current_user.id}


@router.post("/refresh", response_model=Token)
def refresh(refresh_data: RefreshTokenRequest, db: Session = Depends(get_db)):
    return auth_service.refresh_tokens(db, refresh_data.refresh_token)


@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    otp = auth_service.send_otp(db, request.email)
    return {
        "message": "Password reset OTP dispatched to registered email",
        "otp_debug": otp,
    }


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    success = auth_service.reset_password(
        db, request.email, request.otp_code, request.new_password
    )
    return {"message": "Password reset successfully", "success": success}


@router.post("/send-otp")
def send_otp(request: OTPRequest, db: Session = Depends(get_db)):
    otp = auth_service.send_otp(db, request.email_or_phone)
    return {"message": "OTP generated and sent", "otp_debug": otp}


@router.post("/verify-otp")
def verify_otp(request: OTPVerifyRequest, db: Session = Depends(get_db)):
    verified = auth_service.verify_otp(db, request.email_or_phone, request.otp_code)
    return {"verified": verified, "message": "OTP verification successful"}


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
