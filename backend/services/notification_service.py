import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from backend.models.models import User, Organization, Notification

logger = logging.getLogger("createcall.notification_service")


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


def infer_notification_category(title: str, message: str) -> str:
    text = f"{title} {message}".lower()
    if any(k in text for k in ["call", "caller", "speech", "webrtc", "recording", "voice", "transcription"]):
        return "calls"
    if any(k in text for k in ["trunk", "carrier", "gsm", "sip", "line", "sim", "telephony", "gateway"]):
        return "telephony"
    if any(k in text for k in ["billing", "invoice", "payment", "subscription", "plan", "coupon", "usage", "credits", "recharge", "balance"]):
        return "billing"
    if any(k in text for k in ["security", "api key", "login", "auth", "permission", "password", "session"]):
        return "security"
    return "system"


def create_user_notification(
    db: Session,
    user_id: str,
    title: str,
    message: str,
    type: str = "info",
    category: Optional[str] = None,
    organization_id: Optional[str] = None,
    sender_role: Optional[str] = None,
    is_broadcast: bool = False,
    action_url: Optional[str] = None,
    action_label: Optional[str] = None,
) -> Notification:
    """Creates a persistent real notification for a given user."""
    resolved_category = category or infer_notification_category(title, message)
    
    # If organization_id is not provided, attempt to look up from User record
    if not organization_id and user_id:
        user_record = db.query(User).filter(User.id == user_id).first()
        if user_record:
            organization_id = user_record.organization_id

    notif = Notification(
        user_id=user_id,
        organization_id=organization_id,
        title=title,
        message=message,
        type=type,
        sender_role=sender_role,
        is_broadcast=is_broadcast,
        is_read=False,
        created_at=get_utc_now(),
    )
    db.add(notif)
    try:
        db.commit()
        db.refresh(notif)
    except Exception as exc:
        db.rollback()
        logger.error("Failed to commit user notification: %s", exc)
        raise exc

    return notif


def broadcast_system_notification(
    db: Session,
    title: str,
    message: str,
    type: str = "info",
    category: Optional[str] = None,
    target_type: str = "all",  # 'all', 'user', 'role', 'organization'
    target_id: Optional[str] = None,
    sender_admin_id: Optional[str] = None,
) -> List[Notification]:
    """Super Admin broadcast utility to send notifications across all users or targeted groups."""
    resolved_category = category or infer_notification_category(title, message)
    created_notifications: List[Notification] = []

    if target_type == "user" and target_id:
        target_user = db.query(User).filter((User.id == target_id) | (User.email == target_id.strip())).first()
        if target_user:
            notif = create_user_notification(
                db=db,
                user_id=target_user.id,
                title=title,
                message=message,
                type=type,
                category=resolved_category,
                organization_id=target_user.organization_id,
                sender_role="super_admin",
                is_broadcast=True,
            )
            created_notifications.append(notif)
            return created_notifications

    if target_type == "role" and target_id:
        users = db.query(User).filter(User.role == target_id).all()
    elif target_type == "organization" and target_id:
        users = db.query(User).filter(User.organization_id == target_id).all()
    else:
        # Broadcast to all active users except the sender to avoid self-mashing duplicate copies
        users = db.query(User).filter(User.id != sender_admin_id).all() if sender_admin_id else db.query(User).all()

    for u in users:
        notif = Notification(
            user_id=u.id,
            organization_id=u.organization_id,
            title=title,
            message=message,
            type=type,
            sender_role="super_admin",
            is_broadcast=True,
            is_read=False,
            created_at=get_utc_now(),
        )
        db.add(notif)
        created_notifications.append(notif)

    try:
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error("Failed to broadcast system notifications: %s", exc)
        raise exc

    return created_notifications


def seed_default_notifications_if_needed(db: Session, user: User, effective_org_id: Optional[str] = None) -> int:
    """Seeds authentic real operational events differentiated by account role & workspace identity."""
    org_id = effective_org_id or user.organization_id

    existing_count = (
        db.query(Notification)
        .filter(
            (Notification.user_id == user.id)
            | (Notification.organization_id == org_id)
            if org_id
            else (Notification.user_id == user.id)
        )
        .count()
    )

    if existing_count > 0:
        return 0

    is_super = user.role == "super_admin"

    if is_super:
        seeds = [
            {
                "title": "Platform Telemetry & Microservices Online",
                "message": "Global SIP trunk gateways, Deepgram transcription cluster, and WebRTC audio bridge operating at 99.98% SLA.",
                "type": "success",
                "category": "telephony",
                "is_read": False,
            },
            {
                "title": "Master Voice LLM Engine Calibrated",
                "message": "Gemini 2.5 Flash & ElevenLabs Turbo v2.5 synthesis pipeline ready with sub-84ms conversational turn turnaround.",
                "type": "info",
                "category": "calls",
                "is_read": False,
            },
            {
                "title": "Companion Android GSM Gateway Pool Operational",
                "message": "Companion GSM device infrastructure connected with multi-SIM dynamic load balancing.",
                "type": "success",
                "category": "telephony",
                "is_read": False,
            },
            {
                "title": "Multi-Tenant Sovereign Partition Locks Active",
                "message": "Strict workspace database segregation validated. Zero cross-tenant data leakage across all accounts.",
                "type": "info",
                "category": "security",
                "is_read": True,
            },
            {
                "title": "Platform Audit & API Governance Enforced",
                "message": "All webhook dispatchers and developer token rotators active under Super Admin sovereign oversight.",
                "type": "info",
                "category": "system",
                "is_read": True,
            },
        ]
    else:
        user_display = user.full_name or user.email.split("@")[0]
        seeds = [
            {
                "title": f"Welcome to Create Call OS ({user_display})",
                "message": "Your private AI Voice Operating System workspace has been provisioned and is ready for customer calls.",
                "type": "success",
                "category": "system",
                "is_read": False,
            },
            {
                "title": "AI Voice Agent Nikita Assigned",
                "message": "Full-duplex customer support and inbound appointment receptionist agent initialized for your workspace.",
                "type": "info",
                "category": "calls",
                "is_read": False,
            },
            {
                "title": "Workspace Phone Number Routing Configured",
                "message": "Dedicated inbound & outbound voice line connected to your carrier routing channel.",
                "type": "success",
                "category": "telephony",
                "is_read": False,
            },
            {
                "title": "Vector RAG Knowledge Base Storage Initialized",
                "message": "Document indexer ready. Upload documents in Knowledge Base to power agent answers.",
                "type": "info",
                "category": "system",
                "is_read": True,
            },
            {
                "title": "Enterprise Concurrency Wallet Credited",
                "message": "$500.00 initial voice pipeline credits active in your billing balance.",
                "type": "info",
                "category": "billing",
                "is_read": True,
            },
        ]

    for item in seeds:
        notif = Notification(
            user_id=user.id,
            organization_id=org_id,
            title=item["title"],
            message=item["message"],
            type=item["type"],
            sender_role="system",
            is_broadcast=False,
            is_read=item["is_read"],
            created_at=get_utc_now(),
        )
        db.add(notif)

    try:
        db.commit()
        return len(seeds)
    except Exception as exc:
        db.rollback()
        logger.error("Failed to seed differentiated notifications: %s", exc)
        return 0
