from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from backend.core.security import decode_token
from backend.database.session import get_db
from backend.models.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def ensure_super_admin_exists(db: Session) -> User:
    """Ensures the master Super Admin user exists in DB with sovereign workspace."""
    admin = db.query(User).filter(User.email == "admin@createcall.ai").first()
    if not admin:
        import uuid
        from backend.core.security import hash_password
        from backend.models.models import Organization

        org = Organization(
            name="Create Call OS Sovereign Workspace",
            slug=f"ws-sovereign-{uuid.uuid4().hex[:6]}",
        )
        db.add(org)
        db.commit()
        db.refresh(org)

        admin = User(
            email="admin@createcall.ai",
            hashed_password=hash_password("admin123"),
            full_name="Alex Vance (Super Admin)",
            role="super_admin",
            organization_id=org.id,
            is_active=True,
            is_verified=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
    elif not admin.organization_id:
        import uuid
        from backend.models.models import Organization

        org = Organization(
            name="Create Call OS Sovereign Workspace",
            slug=f"ws-sovereign-{uuid.uuid4().hex[:6]}",
        )
        db.add(org)
        db.commit()
        db.refresh(org)
        admin.organization_id = org.id
        db.commit()

    return admin


def get_current_user_optional(
    db: Session = Depends(get_db),
    token: str | None = Depends(oauth2_scheme),
    authorization: str | None = Header(None),
) -> User | None:
    actual_token = token
    if not actual_token and authorization and authorization.startswith("Bearer "):
        actual_token = authorization.split(" ")[1]

    if actual_token:
        try:
            payload = decode_token(actual_token)
            if payload:
                user_id = payload.get("sub")
                user = db.query(User).filter((User.id == user_id) | (User.email == user_id)).first()
                if user and user.is_active:
                    if not user.organization_id:
                        import uuid
                        from backend.models.models import Organization
                        clean_name = (user.full_name or user.email.split("@")[0]).strip()
                        org = Organization(
                            name=f"{clean_name}'s Workspace",
                            slug=f"ws-{uuid.uuid4().hex[:8]}"
                        )
                        db.add(org)
                        db.commit()
                        db.refresh(org)
                        user.organization_id = org.id
                        db.commit()
                    return user
        except Exception:
            pass

    return None


def get_current_user(
    db: Session = Depends(get_db),
    token: str | None = Depends(oauth2_scheme),
    authorization: str | None = Header(None),
) -> User:
    user = get_current_user_optional(db=db, token=token, authorization=authorization)
    if user:
        return user

    # Ensure sovereign super admin is seeded if needed
    ensure_super_admin_exists(db)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication token is missing, expired, or invalid. Please sign in.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def require_role(roles: list[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles and "super_admin" not in current_user.role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted for current user role",
            )
        return current_user

    return role_checker


def get_effective_org_id(
    current_user: User | None,
    target_org_header: str | None = None,
) -> str | None:
    """
    Returns the effective organization ID for query scoping:
    1. If user is Super Admin and a target_org_header is provided, scopes to target workspace.
    2. If user is Super Admin without target header, scopes to Super Admin's sovereign workspace.
    3. If user is regular tenant, strictly scopes to current_user.organization_id (isolation).
    """
    if not current_user:
        return None

    is_super_admin = (
        current_user.role == "super_admin"
        or current_user.email == "admin@createcall.ai"
    )

    if is_super_admin:
        if target_org_header and isinstance(target_org_header, str) and target_org_header.strip():
            return target_org_header.strip()
        return current_user.organization_id

    return current_user.organization_id

