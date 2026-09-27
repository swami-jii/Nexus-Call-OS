import base64
import json
import urllib.parse
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from backend.auth.deps import get_current_user
from backend.core.config import settings as app_settings
from backend.database.session import get_db
from backend.models.models import User, WorkspaceSettings
from backend.schemas.schemas import (
    ForgotPasswordRequest,
    OTPRequest,
    OTPVerifyRequest,
    RefreshTokenRequest,
    RegisterVerifyRequest,
    ResetPasswordRequest,
    SSOLoginRequest,
    Token,
    TwoFALoginRequest,
    UserLogin,
    UserOut,
    UserRegister,
    UserRegisterResponse,
)
from backend.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _resolve_frontend_base(request: Request, return_to: str | None = None) -> str:
    """Resolves the user-facing frontend base URL (e.g. http://localhost:3000)."""
    if return_to and return_to.strip().startswith(("http://", "https://")):
        return return_to.strip().rstrip("/")
    if app_settings.FRONTEND_BASE_URL and app_settings.FRONTEND_BASE_URL.strip():
        return app_settings.FRONTEND_BASE_URL.strip().rstrip("/")
    
    # Try referer / origin header if user arrived from frontend
    referer = request.headers.get("referer") or request.headers.get("origin") or ""
    if referer and referer.startswith(("http://", "https://")):
        parsed = urllib.parse.urlparse(referer)
        return f"{parsed.scheme}://{parsed.netloc}".rstrip("/")

    # Default fallback
    client_host = request.headers.get("x-forwarded-host") or request.headers.get("host") or "localhost:3000"
    scheme = request.headers.get("x-forwarded-proto") or request.url.scheme or "http"
    if ":8000" in client_host:
        # Default Vite port
        return f"{scheme}://{client_host.replace(':8000', ':3000')}"
    return f"{scheme}://{client_host}".rstrip("/")


def _resolve_callback_uri(provider: str, request: Request, redirect_uri: str | None = None) -> str:
    """Resolves the exact OAuth 2.0 redirect_uri callback to send to Google/GitHub/Discord."""
    if redirect_uri and redirect_uri.strip().startswith(("http://", "https://")):
        return redirect_uri.strip()
    if app_settings.OAUTH_REDIRECT_BASE_URL and app_settings.OAUTH_REDIRECT_BASE_URL.strip():
        base = app_settings.OAUTH_REDIRECT_BASE_URL.strip().rstrip("/")
        return f"{base}/auth/oauth/{provider}/callback"

    client_host = request.headers.get("x-forwarded-host") or request.headers.get("host") or "127.0.0.1:8000"
    scheme = request.headers.get("x-forwarded-proto") or request.url.scheme or "http"
    return f"{scheme}://{client_host}/auth/oauth/{provider}/callback"


def _encode_oauth_state(frontend_url: str, callback_uri: str) -> str:
    payload = {"fe": frontend_url, "cb": callback_uri, "n": uuid.uuid4().hex[:8]}
    return base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()


def _decode_oauth_state(state_str: str | None) -> dict[str, str]:
    if not state_str:
        return {}
    try:
        raw = base64.urlsafe_b64decode(state_str.encode()).decode()
        return json.loads(raw)
    except Exception:
        return {}


@router.post("/register", response_model=UserRegisterResponse, status_code=status.HTTP_200_OK)
@router.post("/register/initiate", response_model=UserRegisterResponse)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """Initiates user registration by validating email domain & dispatching real 6-digit OTP code."""
    return auth_service.register_user(db, user_in)


@router.post("/verify-registration", response_model=Token)
@router.post("/register/verify", response_model=Token)
def verify_registration(req: RegisterVerifyRequest, db: Session = Depends(get_db)):
    """Validates 6-digit verification code, activates account, and provisions isolated workspace."""
    return auth_service.verify_registration(db, req)


@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    return auth_service.authenticate_user(db, login_data)


@router.post("/login/2fa", response_model=Token)
@router.post("/verify-2fa", response_model=Token)
def login_2fa(req: TwoFALoginRequest, db: Session = Depends(get_db)):
    return auth_service.authenticate_2fa_login(db, req)


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Successfully logged out", "user_id": current_user.id}


@router.post("/refresh", response_model=Token)
def refresh(refresh_data: RefreshTokenRequest, db: Session = Depends(get_db)):
    return auth_service.refresh_tokens(db, refresh_data.refresh_token)


@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    auth_service.send_otp(db, request.email)
    return {
        "message": "A 6-digit password recovery code has been securely dispatched to your registered email address.",
        "success": True,
    }


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    success = auth_service.reset_password(
        db, request.email, request.otp_code, request.new_password
    )
    return {"message": "Password reset successfully", "success": success}


@router.post("/send-otp")
def send_otp(request: OTPRequest, db: Session = Depends(get_db)):
    auth_service.send_otp(db, request.email_or_phone)
    return {
        "message": "A 6-digit verification code has been dispatched to your email address.",
        "success": True,
    }


@router.post("/verify-otp")
def verify_otp(request: OTPVerifyRequest, db: Session = Depends(get_db)):
    verified = auth_service.verify_otp(db, request.email_or_phone, request.otp_code)
    return {"verified": verified, "message": "OTP verification successful"}


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/sso/providers")
def get_sso_providers(
    org_id: Optional[str] = None,
    workspace: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Returns active enabled SSO identity providers configured in workspace governance."""
    query = db.query(WorkspaceSettings)
    if org_id:
        query = query.filter(WorkspaceSettings.organization_id == org_id)
    elif workspace:
        org = db.query(Organization).filter((Organization.slug == workspace) | (Organization.name == workspace)).first()
        if org:
            query = query.filter(WorkspaceSettings.organization_id == org.id)

    setting = query.first()
    features = dict(setting.features) if setting and isinstance(setting.features, dict) else {}
    return {
        "google": bool(features.get("oauthGoogle", True)),
        "github": bool(features.get("oauthGithub", True)),
        "discord": bool(features.get("oauthDiscord", True)),
        "apple": bool(features.get("oauthApple", True)),
        "microsoft": bool(features.get("oauthMicrosoft", False)),
    }


@router.post("/sso/login", response_model=Token)
@router.post("/sso/callback", response_model=Token)
def sso_login(sso_data: SSOLoginRequest, db: Session = Depends(get_db)):
    """Authenticates or federates enterprise identity from Google, GitHub, Apple, or Discord."""
    return auth_service.authenticate_sso(db, sso_data)


@router.get("/oauth/status")
def get_oauth_status():
    """Returns configuration status for Google, GitHub, Apple, Discord, and Microsoft OAuth."""
    return auth_service.get_oauth_status()


@router.get("/oauth/{provider}/url")
def get_oauth_url(
    provider: str,
    request: Request,
    redirect_uri: str | None = None,
    return_to: str | None = None,
):
    """Returns the direct authorization URL for Google, GitHub, Apple, Discord, or Microsoft."""
    callback_uri = _resolve_callback_uri(provider, request, redirect_uri)
    frontend_base = _resolve_frontend_base(request, return_to)
    state = _encode_oauth_state(frontend_base, callback_uri)

    auth_url = auth_service.get_oauth_authorization_url(
        provider=provider, redirect_uri=callback_uri, state=state
    )
    return {"url": auth_url, "provider": provider, "redirect_uri": callback_uri}


@router.get("/oauth/{provider}/login")
def oauth_login_redirect(
    provider: str,
    request: Request,
    redirect_uri: str | None = None,
    return_to: str | None = None,
):
    """Directly redirects browser to Google, GitHub, Apple, Discord, or Microsoft OAuth consent screen."""
    callback_uri = _resolve_callback_uri(provider, request, redirect_uri)
    frontend_base = _resolve_frontend_base(request, return_to)
    state = _encode_oauth_state(frontend_base, callback_uri)

    auth_url = auth_service.get_oauth_authorization_url(
        provider=provider, redirect_uri=callback_uri, state=state
    )
    return RedirectResponse(url=auth_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)


@router.get("/oauth/{provider}/callback")
def oauth_callback(
    provider: str,
    request: Request,
    code: str | None = None,
    error: str | None = None,
    state: str | None = None,
    db: Session = Depends(get_db),
):
    """Receives authorization code from provider, exchanges tokens, and redirects smoothly back into the Frontend App."""
    state_data = _decode_oauth_state(state)
    frontend_base = state_data.get("fe") or _resolve_frontend_base(request)
    callback_uri = state_data.get("cb") or _resolve_callback_uri(provider, request)

    if error:
        return RedirectResponse(
            url=f"{frontend_base}/?oauth_error={urllib.parse.quote(error)}&provider={provider}",
            status_code=status.HTTP_307_TEMPORARY_REDIRECT,
        )

    if not code:
        return RedirectResponse(
            url=f"{frontend_base}/?oauth_error=Authorization+code+not+provided&provider={provider}",
            status_code=status.HTTP_307_TEMPORARY_REDIRECT,
        )

    try:
        token_data = auth_service.process_oauth_callback(
            db=db,
            provider=provider,
            code=code,
            redirect_uri=callback_uri,
        )
        access_token = token_data.get("access_token", "")
        refresh_token = token_data.get("refresh_token", "")
        user_info = token_data.get("user", {})
        user_email = user_info.get("email", "")
        avatar_url = user_info.get("avatar_url") or ""

        return RedirectResponse(
            url=f"{frontend_base}/?token={access_token}&refresh={refresh_token}&email={urllib.parse.quote(user_email)}&avatar={urllib.parse.quote(avatar_url)}&provider={provider}",
            status_code=status.HTTP_307_TEMPORARY_REDIRECT,
        )
    except Exception as exc:
        err_msg = str(getattr(exc, "detail", exc))
        return RedirectResponse(
            url=f"{frontend_base}/?oauth_error={urllib.parse.quote(err_msg)}&provider={provider}",
            status_code=status.HTTP_307_TEMPORARY_REDIRECT,
        )


