from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.auth.deps import (
    get_current_user,
    get_current_user_optional,
    ensure_super_admin_exists,
    get_effective_org_id,
)
from backend.database.session import get_db
from backend.models.models import User
from backend.repositories.repositories import campaign_repo
from backend.schemas.schemas import (
    CampaignCreate,
    CampaignOut,
    CampaignUpdate,
    PaginatedResponse,
)

router = APIRouter(prefix="/api/campaigns", tags=["Voice Campaigns"])


@router.get("", response_model=PaginatedResponse)
def list_campaigns(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    status_filter: str | None = None,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
    x_target_organization_id: str | None = Header(None, alias="X-Target-Organization-Id"),
):
    effective_user = current_user or ensure_super_admin_exists(db)
    effective_org_id = get_effective_org_id(effective_user, x_target_organization_id)
    skip = (page - 1) * page_size
    filters = {}
    if status_filter:
        filters["status"] = status_filter
    if effective_org_id:
        filters["organization_id"] = effective_org_id
    elif effective_user.organization_id:
        filters["organization_id"] = effective_user.organization_id

    items = campaign_repo.get_multi(
        db,
        skip=skip,
        limit=page_size,
        filters=filters,
        search_query=search,
        search_fields=["name", "type", "schedule_type"],
    )
    total = campaign_repo.count(
        db,
        filters=filters,
        search_query=search,
        search_fields=["name", "type", "schedule_type"],
    )

    pages = (total + page_size - 1) // page_size if total > 0 else 1
    return {
        "items": [CampaignOut.model_validate(item) for item in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }


@router.post("", response_model=CampaignOut, status_code=status.HTTP_201_CREATED)
def create_campaign(
    campaign_in: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
    x_target_organization_id: str | None = Header(None, alias="X-Target-Organization-Id"),
):
    effective_user = current_user or ensure_super_admin_exists(db)
    effective_org_id = get_effective_org_id(effective_user, x_target_organization_id) or effective_user.organization_id
    data = campaign_in.model_dump()
    data["organization_id"] = effective_org_id
    return campaign_repo.create(db, data)



@router.get("/{campaign_id}", response_model=CampaignOut)
def get_campaign(
    campaign_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    campaign = campaign_repo.get_by_id(db, campaign_id)
    is_super_admin = (current_user.role == "super_admin" or current_user.email == "admin@createcall.ai")
    if not campaign or (not is_super_admin and current_user.organization_id and campaign.organization_id != current_user.organization_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found"
        )
    return campaign


@router.put("/{campaign_id}", response_model=CampaignOut)
@router.patch("/{campaign_id}", response_model=CampaignOut)
def update_campaign(
    campaign_id: str,
    campaign_in: CampaignUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    campaign = campaign_repo.get_by_id(db, campaign_id)
    is_super_admin = (current_user.role == "super_admin" or current_user.email == "admin@createcall.ai")
    if not campaign or (not is_super_admin and current_user.organization_id and campaign.organization_id != current_user.organization_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found"
        )
    return campaign_repo.update(db, campaign, campaign_in.model_dump(exclude_unset=True))


@router.delete("/{campaign_id}")
def delete_campaign(
    campaign_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    campaign = campaign_repo.get_by_id(db, campaign_id)
    is_super_admin = (current_user.role == "super_admin" or current_user.email == "admin@createcall.ai")
    if not campaign or (not is_super_admin and current_user.organization_id and campaign.organization_id != current_user.organization_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found"
        )
    campaign_repo.delete(db, campaign_id)
    return {"message": "Campaign deleted successfully", "id": campaign_id}
