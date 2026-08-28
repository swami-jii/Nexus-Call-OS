from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.auth.deps import get_current_user, require_role
from backend.core.security import hash_password
from backend.database.session import get_db
from backend.models.models import User
from backend.repositories.repositories import user_repo
from backend.schemas.schemas import PaginatedResponse, UserOut, UserUpdate

router = APIRouter(prefix="/api/users", tags=["User Management"])


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

    return user_repo.update(db, current_user, update_data)


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
