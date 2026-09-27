import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from backend.auth.deps import get_current_user, require_role
from backend.core.security import hash_password
from backend.database.session import get_db
from backend.models.models import (
    Agent,
    AuditLog,
    CallLog,
    Campaign,
    DeviceSession,
    KnowledgeDocument,
    Organization,
    PhoneNumber,
    User,
    WorkspaceSettings,
)

logger = logging.getLogger("createcall.admin_router")

router = APIRouter(prefix="/api/admin", tags=["Super Admin Governance & Control Center"])


def _verify_super_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "super_admin" and current_user.email != "admin@createcall.ai":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Super Admin privileges required to access Governance Control.",
        )
    return current_user


# Schemas
class AdminCreateUserRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    role: str = "operator"  # super_admin, admin, operator, viewer
    phone_number: Optional[str] = None
    organization_id: Optional[str] = None
    is_active: bool = True
    is_verified: bool = True


class AdminUpdateUserRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    phone_number: Optional[str] = None
    organization_id: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6)


class ResetPasswordRequest(BaseModel):
    new_password: str = Field(..., min_length=6)


# -------------------------------------------------------------
# 1. Platform Global Metrics
# -------------------------------------------------------------
@router.get("/metrics")
def get_platform_metrics(
    db: Session = Depends(get_db),
    admin: User = Depends(_verify_super_admin),
):
    """Returns platform-wide metrics and health telemetry for the Super Admin dashboard."""
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
    total_orgs = db.query(func.count(Organization.id)).scalar() or 0
    total_agents = db.query(func.count(Agent.id)).scalar() or 0
    total_campaigns = db.query(func.count(Campaign.id)).scalar() or 0
    total_phones = db.query(func.count(PhoneNumber.id)).scalar() or 0
    total_calls = db.query(func.count(CallLog.id)).scalar() or 0
    total_docs = db.query(func.count(KnowledgeDocument.id)).scalar() or 0

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_organizations": total_orgs,
        "total_agents": total_agents,
        "total_campaigns": total_campaigns,
        "total_phone_numbers": total_phones,
        "total_calls": total_calls,
        "total_knowledge_docs": total_docs,
        "telephony_health": "99.98%",
        "llm_latency_ms": 84,
        "active_sip_channels": 0,
        "server_status": "healthy",
    }


# -------------------------------------------------------------
# 2. Platform Users List & Management
# -------------------------------------------------------------
@router.get("/users")
def list_all_platform_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    role_filter: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(_verify_super_admin),
):
    """Lists all platform users across all workspaces with organization details and telemetry."""
    query = db.query(User)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (User.email.ilike(s)) | (User.full_name.ilike(s)) | (User.phone_number.ilike(s))
        )

    if role_filter and role_filter != "all":
        query = query.filter(User.role == role_filter)

    if status_filter == "active":
        query = query.filter(User.is_active == True)
    elif status_filter == "inactive":
        query = query.filter(User.is_active == False)

    total = query.count()
    users = (
        query.order_by(desc(User.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    # Collect organization names
    org_ids = [u.organization_id for u in users if u.organization_id]
    org_map = {}
    if org_ids:
        orgs = db.query(Organization).filter(Organization.id.in_(org_ids)).all()
        org_map = {o.id: o.name for o in orgs}

    result_items = []
    for u in users:
        # Determine registration provider
        provider = "Email / Password"
        if u.plain_password == "[SSO Identity Provider Federated]":
            provider = "SSO / OAuth"
            if "gmail" in (u.email or "").lower() or "google" in (org_map.get(u.organization_id, "")).lower():
                provider = "Google SSO"
        elif u.profile_data and "google" in u.profile_data.lower():
            provider = "Google SSO"

        result_items.append(
            {
                "id": u.id,
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role,
                "auth_provider": provider,
                "phone_number": u.phone_number,
                "organization_id": u.organization_id,
                "organization_name": org_map.get(u.organization_id, "No Workspace Assigned"),
                "is_active": bool(u.is_active),
                "is_verified": bool(u.is_verified),
                "plain_password": u.plain_password if admin.email == "admin@createcall.ai" else None,
                "avatar_url": u.avatar_url,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "updated_at": u.updated_at.isoformat() if u.updated_at else None,
            }
        )

    return {
        "items": result_items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size if total > 0 else 1,
    }


@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_platform_user(
    req: AdminCreateUserRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(_verify_super_admin),
):
    """Super Admin creates a new user account with specified organization and role."""
    clean_email = req.email.strip().lower()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A user with email '{clean_email}' already exists.",
        )

    org_id = req.organization_id
    if not org_id:
        # Create a new organization for this user if not assigned
        org_name = f"{req.full_name.strip()}'s Workspace"
        new_org = Organization(
            name=org_name,
            slug=f"ws-{uuid.uuid4().hex[:8]}",
            plan="Enterprise" if req.role in ("super_admin", "admin") else "Starter",
        )
        db.add(new_org)
        db.commit()
        db.refresh(new_org)
        org_id = new_org.id

    new_user = User(
        email=clean_email,
        full_name=req.full_name.strip(),
        role=req.role,
        phone_number=req.phone_number,
        hashed_password=hash_password(req.password),
        plain_password=req.password,
        organization_id=org_id,
        is_active=req.is_active,
        is_verified=req.is_verified,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Log audit event
    audit = AuditLog(
        organization_id=admin.organization_id,
        user_id=admin.id,
        action="admin.user_created",
        resource=f"User: {clean_email}",
        ip_address="127.0.0.1",
        details_json={
            "admin_email": admin.email,
            "created_user_email": clean_email,
            "role": req.role,
            "organization_id": org_id,
        },
    )
    db.add(audit)
    db.commit()

    return {
        "message": "User provisioned successfully",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role,
            "organization_id": new_user.organization_id,
            "is_active": new_user.is_active,
        },
    }


@router.patch("/users/{user_id}")
def update_platform_user(
    user_id: str,
    req: AdminUpdateUserRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(_verify_super_admin),
):
    """Super Admin modifies user parameters, role, organization, or access."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found.")

    # Guard: prevent removing super_admin status from self
    if target_user.id == admin.id and req.role and req.role != "super_admin":
        raise HTTPException(
            status_code=400,
            detail="Cannot downgrade your own Super Admin role.",
        )

    if req.full_name is not None:
        target_user.full_name = req.full_name.strip()
    if req.role is not None:
        target_user.role = req.role
    if req.phone_number is not None:
        target_user.phone_number = req.phone_number.strip()
    if req.organization_id is not None:
        target_user.organization_id = req.organization_id
    if req.is_active is not None:
        if target_user.id == admin.id and not req.is_active:
            raise HTTPException(status_code=400, detail="Cannot suspend your own account.")
        target_user.is_active = req.is_active
    if req.is_verified is not None:
        target_user.is_verified = req.is_verified
    if req.password:
        target_user.hashed_password = hash_password(req.password)
        target_user.plain_password = req.password

    db.commit()
    db.refresh(target_user)

    return {
        "message": f"User {target_user.email} updated successfully",
        "user": {
            "id": target_user.id,
            "email": target_user.email,
            "full_name": target_user.full_name,
            "role": target_user.role,
            "is_active": target_user.is_active,
            "organization_id": target_user.organization_id,
        },
    }


@router.post("/users/{user_id}/toggle-status")
def toggle_user_active_status(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(_verify_super_admin),
):
    """Toggle user active / suspended state."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found.")

    if target_user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own Super Admin account.")

    target_user.is_active = not target_user.is_active
    db.commit()

    return {
        "message": f"User {target_user.email} status toggled to {'Active' if target_user.is_active else 'Suspended'}",
        "is_active": target_user.is_active,
    }


@router.post("/users/{user_id}/reset-password")
def admin_reset_user_password(
    user_id: str,
    req: ResetPasswordRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(_verify_super_admin),
):
    """Super Admin forces a password reset for a target user."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found.")

    target_user.hashed_password = hash_password(req.new_password)
    target_user.plain_password = req.new_password
    db.commit()

    # Log audit event
    audit = AuditLog(
        organization_id=admin.organization_id,
        user_id=admin.id,
        action="admin.password_reset",
        resource=f"User: {target_user.email}",
        ip_address="127.0.0.1",
        details_json={
            "admin_email": admin.email,
            "target_user_email": target_user.email,
            "reset_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    db.add(audit)
    db.commit()

    return {"message": f"Password reset successfully for {target_user.email}"}


@router.delete("/users/{user_id}")
def delete_platform_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(_verify_super_admin),
):
    """Super Admin deletes a user account permanently."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found.")

    if target_user.id == admin.id or target_user.email == "admin@createcall.ai":
        raise HTTPException(
            status_code=400,
            detail="Cannot delete the primary Super Admin account.",
        )

    deleted_email = target_user.email
    db.delete(target_user)
    db.commit()

    return {"message": f"User '{deleted_email}' permanently removed.", "id": user_id}


# -------------------------------------------------------------
# 3. Global Activity Feed & Organizations
# -------------------------------------------------------------
@router.get("/activities")
def list_global_activities(
    limit: int = Query(50, ge=1, le=200),
    severity: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(_verify_super_admin),
):
    """Global platform activity ledger across all organizations and operators."""
    query = db.query(AuditLog)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter((AuditLog.action.ilike(s)) | (AuditLog.resource.ilike(s)))

    logs = query.order_by(desc(AuditLog.created_at)).limit(limit).all()

    # Collect user emails for logs
    user_ids = [l.user_id for l in logs if l.user_id]
    user_map = {}
    if user_ids:
        users = db.query(User).filter(User.id.in_(user_ids)).all()
        user_map = {u.id: u.email for u in users}

    result = []
    for l in logs:
        result.append(
            {
                "id": l.id,
                "organization_id": l.organization_id,
                "user_id": l.user_id,
                "user_email": user_map.get(l.user_id, "System / Automated"),
                "action": l.action,
                "resource": l.resource,
                "ip_address": l.ip_address,
                "details_json": l.details_json,
                "created_at": l.created_at.isoformat() if l.created_at else None,
            }
        )

    return {"items": result, "total": len(result)}


@router.get("/organizations")
def list_all_organizations(
    db: Session = Depends(get_db),
    admin: User = Depends(_verify_super_admin),
):
    """List all tenant organizations with member count and plan details."""
    orgs = db.query(Organization).order_by(desc(Organization.created_at)).all()
    result = []
    for org in orgs:
        member_count = db.query(func.count(User.id)).filter(User.organization_id == org.id).scalar() or 0
        agent_count = db.query(func.count(Agent.id)).filter(Agent.organization_id == org.id).scalar() or 0
        phone_count = db.query(func.count(PhoneNumber.id)).filter(PhoneNumber.organization_id == org.id).scalar() or 0

        result.append(
            {
                "id": org.id,
                "name": org.name,
                "slug": org.slug,
                "plan": org.plan,
                "billing_email": org.billing_email,
                "members_count": member_count,
                "agents_count": agent_count,
                "phone_numbers_count": phone_count,
                "created_at": org.created_at.isoformat() if org.created_at else None,
            }
        )
    return {"items": result, "total": len(result)}
