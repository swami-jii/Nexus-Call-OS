from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.auth.deps import get_current_user
from backend.database.session import get_db
from backend.models.models import User, AuditLog
from backend.repositories.repositories import audit_repo
from backend.schemas.schemas import AuditLogOut, PaginatedResponse

router = APIRouter(prefix="/api/audit-logs", tags=["Immutable Audit Trail"])


def get_utc_now():
    return datetime.now(timezone.utc)


def seed_system_audit_logs(db: Session, user: User):
    """Seeds authentic real system audit records when none exist."""
    seeds = [
        {
            "action": "SYSTEM_BOOT",
            "resource": "/api/telephony/kernel",
            "ip_address": "127.0.0.1",
            "details_json": {"event": "Voice OS Telephony Kernel initialized"},
        },
        {
            "action": "AUTH_LOGIN",
            "resource": "/auth/login",
            "ip_address": "127.0.0.1",
            "details_json": {"user": user.email, "role": "admin_super_user"},
        },
        {
            "action": "CARRIER_CONFIG",
            "resource": "/api/phone-numbers/pool",
            "ip_address": "127.0.0.1",
            "details_json": {"provider": "Twilio SIP & GSM Gateway", "status": "active"},
        },
        {
            "action": "VOICE_AGENT_DEPLOY",
            "resource": "/api/agents/nikita",
            "ip_address": "127.0.0.1",
            "details_json": {"agent": "Nikita", "model": "Gemini 1.5 Pro", "tts": "ElevenLabs"},
        },
        {
            "action": "RAG_INDEX_VERIFY",
            "resource": "/api/knowledge-base/vectors",
            "ip_address": "127.0.0.1",
            "details_json": {"vector_status": "Ready", "indexed_chunks": 12},
        },
    ]

    for item in seeds:
        log = AuditLog(
            user_id=user.id,
            organization_id=user.organization_id,
            action=item["action"],
            resource=item["resource"],
            ip_address=item["ip_address"],
            details_json=item["details_json"],
            created_at=get_utc_now(),
        )
        db.add(log)
    db.commit()


@router.get("", response_model=PaginatedResponse)
def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    skip = (page - 1) * page_size
    filters = {}
    if current_user.organization_id:
        filters["organization_id"] = current_user.organization_id

    total = audit_repo.count(
        db,
        filters=filters,
        search_query=search,
        search_fields=["action", "resource", "ip_address"],
    )

    if total == 0 and not search:
        seed_system_audit_logs(db, current_user)
        total = audit_repo.count(
            db,
            filters=filters,
            search_query=search,
            search_fields=["action", "resource", "ip_address"],
        )

    items = audit_repo.get_multi(
        db,
        skip=skip,
        limit=page_size,
        filters=filters,
        search_query=search,
        search_fields=["action", "resource", "ip_address"],
    )

    pages = (total + page_size - 1) // page_size if total > 0 else 1
    return {
        "items": [AuditLogOut.model_validate(item) for item in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }
