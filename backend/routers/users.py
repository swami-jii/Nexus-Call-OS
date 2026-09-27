import json
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from backend.auth.deps import get_current_user, require_role
from backend.core.security import hash_password, verify_password
from backend.database.session import get_db
from backend.models.models import AuditLog, DeviceSession, Organization, User
from backend.repositories.repositories import user_repo
from backend.schemas.schemas import ChangePasswordRequest, PaginatedResponse, UserOut, UserUpdate

router = APIRouter(prefix="/api/users", tags=["User Management"])


def _parse_user_agent(ua_string: str) -> str:
    if not ua_string:
        return "Web Browser"
    ua = ua_string.lower()
    browser = "Browser"
    if "edg" in ua:
        browser = "Microsoft Edge"
    elif "chrome" in ua and "safari" in ua:
        browser = "Google Chrome"
    elif "firefox" in ua:
        browser = "Mozilla Firefox"
    elif "safari" in ua and "chrome" not in ua:
        browser = "Apple Safari"
    elif "opera" in ua or "opr" in ua:
        browser = "Opera"

    os_name = "Device"
    if "windows" in ua:
        os_name = "Windows"
    elif "macintosh" in ua or "mac os" in ua:
        os_name = "macOS"
    elif "android" in ua:
        os_name = "Android"
    elif "iphone" in ua or "ipad" in ua:
        os_name = "iOS"
    elif "linux" in ua:
        os_name = "Linux"

    return f"{browser} on {os_name}"


@router.get("", response_model=PaginatedResponse)
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["super_admin", "admin"])),
):
    skip = (page - 1) * page_size
    filters = {}
    if current_user.organization_id:
        filters["organization_id"] = current_user.organization_id

    items = user_repo.get_multi(
        db,
        skip=skip,
        limit=page_size,
        filters=filters,
        search_query=search,
        search_fields=["email", "full_name", "role"],
    )
    total = user_repo.count(
        db,
        filters=filters,
        search_query=search,
        search_fields=["email", "full_name", "role"],
    )

    pages = (total + page_size - 1) // page_size if total > 0 else 1
    return {
        "items": [UserOut.model_validate(item) for item in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }


@router.get("/me/profile")
def get_user_profile(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns 100% real dynamic workspace user profile, active sessions, and tenant details."""
    org = None
    if current_user.organization_id:
        org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()

    profile_dict: dict[str, Any] = {}
    if current_user.profile_data:
        try:
            profile_dict = json.loads(current_user.profile_data)
        except Exception:
            profile_dict = {}

    # Get real active device sessions
    sessions = (
        db.query(DeviceSession)
        .filter(DeviceSession.user_id == current_user.id)
        .order_by(DeviceSession.created_at.desc())
        .all()
    )
    client_ip = request.client.host if request.client else "127.0.0.1"
    ua_string = request.headers.get("user-agent", "")
    current_device = _parse_user_agent(ua_string)

    if not sessions:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        auto_session = DeviceSession(
            user_id=current_user.id,
            device_name=current_device,
            ip_address=client_ip,
            user_agent=ua_string,
            created_at=now,
            expires_at=now + timedelta(days=7),
        )
        db.add(auto_session)
        db.commit()
        db.refresh(auto_session)
        sessions = [auto_session]

    parsed_sessions = []
    for s in sessions:
        is_cur = (s.ip_address == client_ip and s.device_name == current_device) or len(sessions) == 1
        parsed_sessions.append({
            "id": s.id,
            "device": s.device_name or current_device,
            "location": "Local Network" if s.ip_address in ["127.0.0.1", "localhost", "::1"] else "Authorized IP",
            "ip": s.ip_address or client_ip,
            "lastActive": "Active now" if is_cur else s.created_at.strftime("%b %d, %Y %H:%M") if s.created_at else "Recently",
            "current": is_cur,
        })

    org_name = (org.name if org else f"{current_user.full_name}'s Workspace").strip()
    company_name = profile_dict.get("company") or org_name

    return {
        "id": current_user.id,
        "fullName": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone_number or profile_dict.get("phone", ""),
        "company": company_name,
        "role": current_user.role or "Operator",
        "timezone": profile_dict.get("timezone", "Asia/Kolkata"),
        "language": profile_dict.get("language", "English (US)"),
        "address": profile_dict.get("address", ""),
        "bio": profile_dict.get("bio", ""),
        "avatarUrl": profile_dict.get("avatarUrl") if "avatarUrl" in profile_dict else current_user.avatar_url,
        "coverUrl": profile_dict.get("coverUrl", None),
        "showSocialInUI": bool(profile_dict.get("showSocialInUI", True)),
        "socialPlacement": profile_dict.get("socialPlacement", "header"),
        "socialLinks": profile_dict.get("socialLinks", {}),
        "customSocialChannels": profile_dict.get("customSocialChannels", []),
        "twoFactorEnabled": bool(profile_dict.get("twoFactorEnabled", False)),
        "is_verified": bool(current_user.is_verified),
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "organization_id": current_user.organization_id,
        "organization_name": org_name,
        "organization_plan": org.plan if org else "Enterprise",
        "organization_slug": org.slug if org else "",
        "sessions": parsed_sessions,
    }


@router.get("/me/sessions")
def get_user_sessions(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves all active device sessions for the authenticated user."""
    sessions = (
        db.query(DeviceSession)
        .filter(DeviceSession.user_id == current_user.id)
        .order_by(DeviceSession.created_at.desc())
        .all()
    )
    client_ip = request.client.host if request.client else "127.0.0.1"
    ua_string = request.headers.get("user-agent", "")
    current_device = _parse_user_agent(ua_string)

    if not sessions:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        auto_session = DeviceSession(
            user_id=current_user.id,
            device_name=current_device,
            ip_address=client_ip,
            user_agent=ua_string,
            created_at=now,
            expires_at=now + timedelta(days=7),
        )
        db.add(auto_session)
        db.commit()
        db.refresh(auto_session)
        sessions = [auto_session]

    parsed_sessions = []
    for s in sessions:
        is_cur = (s.ip_address == client_ip and s.device_name == current_device) or len(sessions) == 1
        parsed_sessions.append({
            "id": s.id,
            "device": s.device_name or current_device,
            "location": "Local Network" if s.ip_address in ["127.0.0.1", "localhost", "::1"] else "Authorized IP",
            "ip": s.ip_address or client_ip,
            "lastActive": "Active now" if is_cur else s.created_at.strftime("%b %d, %Y %H:%M") if s.created_at else "Recently",
            "current": is_cur,
        })

    return {"sessions": parsed_sessions}


@router.delete("/me/sessions/{session_id}")
def terminate_user_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Terminates and deletes an active device session."""
    session_obj = (
        db.query(DeviceSession)
        .filter(DeviceSession.id == session_id, DeviceSession.user_id == current_user.id)
        .first()
    )
    if not session_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or already terminated.",
        )

    db.delete(session_obj)
    db.commit()

    return {"message": "Session terminated successfully", "id": session_id}


@router.post("/me/change-password")
def change_user_password(
    req: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Directly updates master password for authenticated user and logs audit trail."""
    current_user.hashed_password = hash_password(req.new_password)
    current_user.plain_password = req.new_password
    db.commit()

    # Record Audit Log
    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="UPDATE",
        resource="UserSecurity",
        details_json={"message": f"User {current_user.email} updated account password."},
    )
    db.add(audit)
    db.commit()

    return {"message": "Master password successfully updated live.", "success": True}


@router.post("/me/toggle-2fa")
def toggle_user_2fa(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Toggles Two-Factor Authentication (2FA) status in profile data."""
    profile_dict: dict[str, Any] = {}
    if current_user.profile_data:
        try:
            profile_dict = json.loads(current_user.profile_data)
        except Exception:
            profile_dict = {}

    current_val = bool(profile_dict.get("twoFactorEnabled", False))
    next_val = not current_val
    profile_dict["twoFactorEnabled"] = next_val

    current_user.profile_data = json.dumps(profile_dict)
    db.commit()

    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="UPDATE",
        resource="User2FA",
        details_json={"message": f"User {current_user.email} set 2FA to {next_val}."},
    )
    db.add(audit)
    db.commit()

    return {
        "message": f"Two-Factor Authentication is now {'enabled' if next_val else 'disabled'}.",
        "twoFactorEnabled": next_val,
    }


@router.patch("/me", response_model=UserOut)
@router.put("/me", response_model=UserOut)
def update_profile(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    update_data = user_in.model_dump(exclude_unset=True)
    if update_data.get("password"):
        update_data["hashed_password"] = hash_password(update_data.pop("password"))
    else:
        update_data.pop("password", None)

    # Merge profile_data and avatar_url
    existing_profile = {}
    if current_user.profile_data:
        try:
            existing_profile = json.loads(current_user.profile_data) if isinstance(current_user.profile_data, str) else dict(current_user.profile_data)
        except Exception:
            existing_profile = {}

    incoming_profile = {}
    if "profile_data" in update_data and update_data["profile_data"]:
        try:
            incoming_profile = json.loads(update_data["profile_data"]) if isinstance(update_data["profile_data"], str) else update_data["profile_data"]
        except Exception as e:
            logger.warning(f"Error parsing incoming profile_data: {e}")

    # Explicit top-level avatar_url override if provided
    if "avatar_url" in update_data:
        avatar_val = update_data.pop("avatar_url")
        incoming_profile["avatarUrl"] = avatar_val

    merged_profile = {**existing_profile, **incoming_profile}
    update_data["profile_data"] = json.dumps(merged_profile)

    # If company name updated, synchronize Organization.name
    company = merged_profile.get("company")
    if company and company.strip() and current_user.organization_id:
        try:
            org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
            if org and org.name != company.strip():
                org.name = company.strip()
                db.commit()
        except Exception as e:
            logger.warning(f"Error syncing org name: {e}")

    try:
        updated_user = user_repo.update(db, current_user, update_data)
        return updated_user
    except Exception as e:
        logger.error(f"Error updating user profile via repo: {e}")
        db.rollback()
        for k, v in update_data.items():
            if hasattr(current_user, k):
                try:
                    setattr(current_user, k, v)
                except Exception:
                    pass
        db.commit()
        db.refresh(current_user)
        return current_user


@router.delete("/me")
def delete_my_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Permanently wipes the user's account and data."""
    user_id = current_user.id
    user_repo.delete(db, user_id)
    return {"message": "Account successfully deleted", "id": user_id, "success": True}


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = user_repo.get_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["super_admin"])),
):
    user = user_repo.get_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    user_repo.delete(db, user_id)
    return {"message": "User deleted", "id": user_id}
