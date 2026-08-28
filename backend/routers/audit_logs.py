from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.auth.deps import get_current_user
from backend.database.session import get_db
from backend.models.models import User
from backend.repositories.repositories import audit_repo
from backend.schemas.schemas import AuditLogOut, PaginatedResponse

router = APIRouter(prefix="/api/audit-logs", tags=["Immutable Audit Trail"])


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

    items = audit_repo.get_multi(
        db,
        skip=skip,
        limit=page_size,
        filters=filters,
        search_query=search,
        search_fields=["action", "resource", "ip_address"],
    )
    total = audit_repo.count(
        db,
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
