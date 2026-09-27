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
from backend.repositories.repositories import phone_repo
from backend.schemas.schemas import (
    PaginatedResponse,
    PhoneNumberCreate,
    PhoneNumberOut,
    PhoneNumberUpdate,
)

router = APIRouter(prefix="/api/phone-numbers", tags=["Phone Numbers"])


@router.get("", response_model=PaginatedResponse)
def list_phone_numbers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
    x_target_organization_id: str | None = Header(None, alias="X-Target-Organization-Id"),
):
    effective_user = current_user or ensure_super_admin_exists(db)
    effective_org_id = get_effective_org_id(effective_user, x_target_organization_id)
    skip = (page - 1) * page_size
    filters = {}
    if effective_org_id:
        filters["organization_id"] = effective_org_id
    elif effective_user.organization_id:
        filters["organization_id"] = effective_user.organization_id

    items = phone_repo.get_multi(
        db,
        skip=skip,
        limit=page_size,
        filters=filters,
        search_query=search,
        search_fields=["number", "provider"],
    )
    total = phone_repo.count(
        db,
        filters=filters,
        search_query=search,
        search_fields=["number", "provider"],
    )

    pages = (total + page_size - 1) // page_size if total > 0 else 1
    return {
        "items": [PhoneNumberOut.model_validate(item) for item in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }


@router.post("", response_model=PhoneNumberOut, status_code=status.HTTP_201_CREATED)
def provision_phone_number(
    phone_in: PhoneNumberCreate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
    x_target_organization_id: str | None = Header(None, alias="X-Target-Organization-Id"),
):
    effective_user = current_user or ensure_super_admin_exists(db)
    effective_org_id = get_effective_org_id(effective_user, x_target_organization_id) or effective_user.organization_id
    data = phone_in.model_dump()
    data["organization_id"] = effective_org_id
    return phone_repo.create(db, data)



@router.get("/{phone_id}", response_model=PhoneNumberOut)
def get_phone_number(
    phone_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    phone = phone_repo.get_by_id(db, phone_id)
    is_super_admin = (current_user.role == "super_admin" or current_user.email == "admin@createcall.ai")
    if not phone or (not is_super_admin and current_user.organization_id and phone.organization_id != current_user.organization_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Phone number not found"
        )
    return phone


@router.patch("/{phone_id}", response_model=PhoneNumberOut)
@router.put("/{phone_id}", response_model=PhoneNumberOut)
def update_phone_number(
    phone_id: str,
    phone_in: PhoneNumberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    phone = phone_repo.get_by_id(db, phone_id)
    is_super_admin = (current_user.role == "super_admin" or current_user.email == "admin@createcall.ai")
    if not phone or (not is_super_admin and current_user.organization_id and phone.organization_id != current_user.organization_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Phone number not found"
        )
    return phone_repo.update(db, phone, phone_in.model_dump(exclude_unset=True))


@router.delete("/{phone_id}")
def release_phone_number(
    phone_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    phone = phone_repo.get_by_id(db, phone_id)
    is_super_admin = (current_user.role == "super_admin" or current_user.email == "admin@createcall.ai")
    if not phone or (not is_super_admin and current_user.organization_id and phone.organization_id != current_user.organization_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Phone number not found"
        )
    phone_repo.delete(db, phone_id)
    return {"message": "Phone number released", "id": phone_id}
