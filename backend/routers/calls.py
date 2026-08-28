from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.auth.deps import get_current_user
from backend.database.session import get_db
from backend.models.models import User
from backend.repositories.repositories import call_repo
from backend.schemas.schemas import (
    CallLogCreate,
    CallLogOut,
    CallLogUpdate,
    PaginatedResponse,
)
from backend.services.webhook_dispatcher import emit_domain_event

router = APIRouter(prefix="/api/calls", tags=["Call History & Telemetry"])


@router.get("", response_model=PaginatedResponse)
def list_calls(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    sentiment: str | None = None,
    status_filter: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    skip = (page - 1) * page_size
    filters = {}
    if sentiment:
        filters["sentiment"] = sentiment
    if status_filter:
        filters["status"] = status_filter
    if current_user.organization_id:
        filters["organization_id"] = current_user.organization_id

    items = call_repo.get_multi(
        db,
        skip=skip,
        limit=page_size,
        filters=filters,
        search_query=search,
        search_fields=["phone_number", "transcript", "sentiment", "status"],
    )
    total = call_repo.count(
        db,
        filters=filters,
        search_query=search,
        search_fields=["phone_number", "transcript", "sentiment", "status"],
    )

    pages = (total + page_size - 1) // page_size if total > 0 else 1
    return {
        "items": [CallLogOut.model_validate(item) for item in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }

@router.post("", response_model=CallLogOut, status_code=status.HTTP_201_CREATED)
def trigger_call(
    call_in: CallLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = call_in.model_dump()
    data["organization_id"] = current_user.organization_id
    created_call = call_repo.create(db, data)
    
    # Emit domain event non-blockingly
    try:
        emit_domain_event(
            event_type="call.started",
            data={
                "call_id": created_call.id,
                "phone_number": created_call.phone_number,
                "direction": created_call.direction,
                "agent_id": created_call.agent_id,
                "campaign_id": created_call.campaign_id,
                "status": created_call.status,
            },
            organization_id=str(current_user.organization_id) if current_user.organization_id is not None else None,
        )
    except Exception:
        pass

    return created_call


@router.get("/{call_id}", response_model=CallLogOut)
def get_call(
    call_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    call = call_repo.get_by_id(db, call_id)
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Call record not found"
        )
    return call


@router.patch("/{call_id}", response_model=CallLogOut)
@router.put("/{call_id}", response_model=CallLogOut)
def update_call(
    call_id: str,
    call_in: CallLogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    call = call_repo.get_by_id(db, call_id)
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Call record not found"
        )
    updated_call = call_repo.update(db, call, call_in.model_dump(exclude_unset=True))
    
    # Emit domain event non-blockingly
    try:
        evt_type = "call.completed" if updated_call.status == "completed" else "call.disposition.updated"
        emit_domain_event(
            event_type=evt_type,
            data={
                "call_id": updated_call.id,
                "phone_number": updated_call.phone_number,
                "direction": updated_call.direction,
                "duration": updated_call.duration,
                "status": updated_call.status,
                "sentiment": updated_call.sentiment,
                "transcript": updated_call.transcript,
                "recording_url": updated_call.recording_url,
            },
            organization_id=str(current_user.organization_id) if current_user.organization_id is not None else None,
        )
    except Exception:
        pass

    return updated_call


@router.delete("/{call_id}")
def delete_call(
    call_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    call = call_repo.get_by_id(db, call_id)
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Call record not found"
        )
    call_repo.delete(db, call_id)
    return {"message": "Call deleted", "id": call_id}
