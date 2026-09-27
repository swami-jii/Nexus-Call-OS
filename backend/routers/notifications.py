from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.auth.deps import (
    ensure_super_admin_exists,
    get_current_user_optional,
    get_effective_org_id,
)
from backend.database.session import get_db
from backend.models.models import User, Organization, Notification
from backend.repositories.repositories import notification_repo
from backend.schemas.schemas import NotificationCreate, NotificationOut
from backend.services.notification_service import (
    create_user_notification,
    broadcast_system_notification,
    seed_default_notifications_if_needed,
    infer_notification_category,
    get_utc_now,
)

router = APIRouter(prefix="/api/notifications", tags=["Notifications & Alerts"])


def _ensure_notification_columns(db: Session):
    """Ensure SQLite table notifications has sender_role and is_broadcast columns if running on existing DB."""
    cols_to_add = [
        ("sender_role", "VARCHAR(50) DEFAULT NULL"),
        ("is_broadcast", "BOOLEAN DEFAULT 0"),
    ]
    for col_name, col_type in cols_to_add:
        try:
            db.execute(text(f"ALTER TABLE notifications ADD COLUMN {col_name} {col_type};"))
            db.commit()
        except Exception:
            db.rollback()


class BroadcastNotificationRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)
    type: str = "info"  # info, warning, success, error
    category: Optional[str] = None  # system, calls, telephony, billing, security
    target_type: str = "all"  # all, user, role, organization
    target_id: Optional[str] = None


def _is_super_admin(user: User) -> bool:
    return user.role == "super_admin"


@router.get("")
def list_notifications(
    unread_only: bool = Query(False),
    category: Optional[str] = Query(None),
    feed_scope: str = Query("workspace"),  # 'workspace', 'global_admin', 'broadcasts'
    severity: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
    x_target_organization_id: Optional[str] = Header(None, alias="X-Target-Organization-Id"),
):
    _ensure_notification_columns(db)
    effective_user = current_user or ensure_super_admin_exists(db)
    effective_org_id = get_effective_org_id(effective_user, x_target_organization_id)

    is_super = _is_super_admin(effective_user)

    query = db.query(Notification)

    # 1. Super Admin Global Audit Feed Mode
    if is_super and feed_scope == "global_admin":
        pass  # Query all platform notifications
    # 2. Super Admin Broadcast History Mode
    elif is_super and feed_scope == "broadcasts":
        query = query.filter((Notification.is_broadcast == True) | (Notification.sender_role == "super_admin"))
    # 3. Default Workspace Scoping (Strict Sovereign Isolation)
    else:
        if effective_org_id:
            if is_super and not x_target_organization_id:
                # Super Admin in sovereign workspace: only show sovereign workspace notifications
                query = query.filter(
                    (Notification.organization_id == effective_org_id)
                    | (Notification.user_id == effective_user.id)
                )
            else:
                # Targeted tenant or standard user
                query = query.filter(
                    (Notification.organization_id == effective_org_id)
                    | (Notification.user_id == effective_user.id)
                )
        else:
            query = query.filter(Notification.user_id == effective_user.id)

    if unread_only:
        query = query.filter(Notification.is_read == False)

    if severity and severity != "all":
        query = query.filter(Notification.type == severity)

    notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()

    # Pre-fetch user and organization mappings for global view if super admin
    user_map = {}
    org_map = {}
    if is_super and feed_scope in ["global_admin", "broadcasts"]:
        user_ids = [n.user_id for n in notifications if n.user_id]
        org_ids = [n.organization_id for n in notifications if n.organization_id]
        if user_ids:
            user_map = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()}
        if org_ids:
            org_map = {o.id: o for o in db.query(Organization).filter(Organization.id.in_(org_ids)).all()}

    results = []
    seen_broadcast_keys = set()

    for n in notifications:
        inferred_cat = infer_notification_category(n.title, n.message)
        if category and category != "all" and inferred_cat != category:
            continue

        if search:
            q = search.lower()
            if q not in n.title.lower() and q not in n.message.lower():
                continue

        sender_role = getattr(n, "sender_role", None) or ("super_admin" if getattr(n, "is_broadcast", False) else "system")
        is_from_super_admin = bool(sender_role == "super_admin" or getattr(n, "is_broadcast", False))

        # In broadcasts feed, group identical broadcasts
        if feed_scope == "broadcasts":
            bc_key = (n.title, n.message, n.created_at.strftime("%Y-%m-%d %H:%M") if n.created_at else "")
            if bc_key in seen_broadcast_keys:
                continue
            seen_broadcast_keys.add(bc_key)

        user_obj = user_map.get(n.user_id) if n.user_id else None
        org_obj = org_map.get(n.organization_id) if n.organization_id else None

        results.append(
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "desc": n.message,
                "type": n.type or "info",
                "category": inferred_cat,
                "sender_role": sender_role,
                "is_super_admin": is_from_super_admin,
                "is_broadcast": bool(getattr(n, "is_broadcast", False)),
                "is_read": bool(n.is_read),
                "read": bool(n.is_read),
                "user_id": n.user_id,
                "user_email": user_obj.email if user_obj else None,
                "organization_id": n.organization_id,
                "organization_name": org_obj.name if org_obj else None,
                "created_at": n.created_at.isoformat() if n.created_at else get_utc_now().isoformat(),
            }
        )

    return results


@router.post("", response_model=NotificationOut, status_code=status.HTTP_201_CREATED)
def create_notification(
    notif_in: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
    x_target_organization_id: Optional[str] = Header(None, alias="X-Target-Organization-Id"),
):
    _ensure_notification_columns(db)
    effective_user = current_user or ensure_super_admin_exists(db)
    effective_org_id = get_effective_org_id(effective_user, x_target_organization_id)

    data = notif_in.model_dump()
    data["user_id"] = effective_user.id
    data["organization_id"] = effective_org_id or effective_user.organization_id
    data["created_at"] = get_utc_now()
    return notification_repo.create(db, data)


@router.post("/broadcast", status_code=status.HTTP_201_CREATED)
def broadcast_notification_endpoint(
    req: BroadcastNotificationRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Super Admin governance power: broadcast notifications across all users or targeted groups."""
    _ensure_notification_columns(db)
    effective_user = current_user or ensure_super_admin_exists(db)

    if not _is_super_admin(effective_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin privileges required to broadcast notifications.",
        )

    created = broadcast_system_notification(
        db=db,
        title=req.title,
        message=req.message,
        type=req.type,
        category=req.category,
        target_type=req.target_type,
        target_id=req.target_id,
        sender_admin_id=effective_user.id,
    )

    return {
        "success": True,
        "message": f"Broadcast dispatched successfully to {len(created)} recipient(s) as Super Admin.",
        "count": len(created),
    }


@router.post("/read-all")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
    x_target_organization_id: Optional[str] = Header(None, alias="X-Target-Organization-Id"),
):
    _ensure_notification_columns(db)
    effective_user = current_user or ensure_super_admin_exists(db)
    effective_org_id = get_effective_org_id(effective_user, x_target_organization_id)

    query = db.query(Notification)
    if effective_org_id:
        query = query.filter(
            (Notification.organization_id == effective_org_id)
            | (Notification.user_id == effective_user.id)
        )
    else:
        query = query.filter(Notification.user_id == effective_user.id)

    query.update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read", "success": True}


@router.post("/{notification_id}/read")
def mark_as_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
    x_target_organization_id: Optional[str] = Header(None, alias="X-Target-Organization-Id"),
):
    _ensure_notification_columns(db)
    effective_user = current_user or ensure_super_admin_exists(db)
    effective_org_id = get_effective_org_id(effective_user, x_target_organization_id)

    query = db.query(Notification).filter(Notification.id == notification_id)
    if effective_org_id:
        query = query.filter(
            (Notification.organization_id == effective_org_id)
            | (Notification.user_id == effective_user.id)
        )
    else:
        query = query.filter(Notification.user_id == effective_user.id)

    notif = query.first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "Notification marked as read", "id": notification_id, "success": True}


@router.delete("/clear-all")
@router.delete("")
def delete_all_notifications(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
    x_target_organization_id: Optional[str] = Header(None, alias="X-Target-Organization-Id"),
):
    _ensure_notification_columns(db)
    effective_user = current_user or ensure_super_admin_exists(db)
    effective_org_id = get_effective_org_id(effective_user, x_target_organization_id)

    query = db.query(Notification)
    if effective_org_id:
        query = query.filter(
            (Notification.organization_id == effective_org_id)
            | (Notification.user_id == effective_user.id)
        )
    else:
        query = query.filter(Notification.user_id == effective_user.id)

    count = query.delete()
    db.commit()
    return {"message": f"Deleted {count} notifications", "count": count, "success": True}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
    x_target_organization_id: Optional[str] = Header(None, alias="X-Target-Organization-Id"),
):
    _ensure_notification_columns(db)
    effective_user = current_user or ensure_super_admin_exists(db)
    effective_org_id = get_effective_org_id(effective_user, x_target_organization_id)

    query = db.query(Notification).filter(Notification.id == notification_id)
    if effective_org_id:
        query = query.filter(
            (Notification.organization_id == effective_org_id)
            | (Notification.user_id == effective_user.id)
        )
    else:
        query = query.filter(Notification.user_id == effective_user.id)

    notif = query.first()
    if notif:
        db.delete(notif)
        db.commit()
    return {"message": "Notification deleted", "id": notification_id, "success": True}
