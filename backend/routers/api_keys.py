import secrets
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.auth.deps import get_current_user
from backend.core.security import hash_password
from backend.database.session import get_db
from backend.models.models import User
from backend.repositories.repositories import api_key_repo
from backend.schemas.schemas import ApiKeyCreate, ApiKeyOut

router = APIRouter(prefix="/api/api-keys", tags=["API Key Governance"])


def _ensure_api_key_columns(db: Session):
    """Ensure SQLite table api_keys has newly added columns if running on existing DB."""
    cols_to_add = [
        ("status", "VARCHAR(50) DEFAULT 'active'"),
        ("environment", "VARCHAR(50) DEFAULT 'production'"),
        ("permissions", "VARCHAR(50) DEFAULT 'full'")
    ]
    for col_name, col_type in cols_to_add:
        try:
            db.execute(text(f"ALTER TABLE api_keys ADD COLUMN {col_name} {col_type};"))
            db.commit()
        except Exception:
            db.rollback()


class ApiKeyUpdatePayload(BaseModel):
    name: str | None = None
    status: str | None = None
    environment: str | None = None
    permissions: str | None = None


@router.get("", response_model=list[ApiKeyOut])
def list_api_keys(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_api_key_columns(db)
    filters = {}
    if current_user.organization_id:
        filters["organization_id"] = current_user.organization_id
    items = api_key_repo.get_multi(db, limit=100, filters=filters)
    return [ApiKeyOut.model_validate(item) for item in items]


@router.post("", status_code=status.HTTP_201_CREATED)
def generate_api_key(
    key_in: ApiKeyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_api_key_columns(db)
    env = key_in.environment or "production"
    env_prefix = "live" if env == "production" else "test"
    raw_key = f"nx_{env_prefix}_{secrets.token_hex(24)}"
    prefix = f"{raw_key[:12]}..."
    key_hash = hash_password(raw_key)

    permissions = key_in.permissions or ("full" if "write" in (key_in.scopes or []) else "read-only")

    created = api_key_repo.create(
        db,
        {
            "name": key_in.name,
            "key_prefix": prefix,
            "key_hash": key_hash,
            "scopes": key_in.scopes or (["read", "write"] if permissions == "full" else ["read"]),
            "status": "active",
            "environment": env,
            "permissions": permissions,
            "organization_id": current_user.organization_id,
            "user_id": current_user.id,
        },
    )

    return {
        "id": created.id,
        "name": created.name,
        "api_key": raw_key,
        "key_prefix": prefix,
        "scopes": created.scopes,
        "status": created.status,
        "environment": created.environment,
        "permissions": created.permissions,
        "created_at": created.created_at,
    }


@router.patch("/{key_id}")
def update_api_key(
    key_id: str,
    payload: ApiKeyUpdatePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_api_key_columns(db)
    key = api_key_repo.get_by_id(db, key_id)
    if not key or (current_user.organization_id and key.organization_id != current_user.organization_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="API key not found"
        )

    updates: dict[str, Any] = {}
    if payload.name is not None:
        updates["name"] = payload.name
    if payload.status is not None:
        updates["status"] = payload.status
    if payload.environment is not None:
        updates["environment"] = payload.environment
    if payload.permissions is not None:
        updates["permissions"] = payload.permissions
        updates["scopes"] = ["read", "write"] if payload.permissions == "full" else ["read"]

    updated = api_key_repo.update(db, key, updates)
    return ApiKeyOut.model_validate(updated)


@router.post("/{key_id}/rotate")
def rotate_api_key(
    key_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_api_key_columns(db)
    key = api_key_repo.get_by_id(db, key_id)
    if not key or (current_user.organization_id and key.organization_id != current_user.organization_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="API key not found"
        )

    env_prefix = "live" if key.environment == "production" else "test"
    new_raw_key = f"nx_{env_prefix}_{secrets.token_hex(24)}"
    new_prefix = f"{new_raw_key[:12]}..."
    new_key_hash = hash_password(new_raw_key)

    from datetime import datetime, timezone
    updated = api_key_repo.update(
        db,
        key,
        {
            "key_prefix": new_prefix,
            "key_hash": new_key_hash,
            "last_used_at": datetime.now(timezone.utc),
        },
    )

    return {
        "id": updated.id,
        "name": updated.name,
        "api_key": new_raw_key,
        "key_prefix": new_prefix,
        "status": updated.status,
        "environment": updated.environment,
        "permissions": updated.permissions,
        "last_used_at": updated.last_used_at,
        "created_at": updated.created_at,
    }


@router.delete("/{key_id}")
def revoke_api_key(
    key_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    key = api_key_repo.get_by_id(db, key_id)
    if not key or (current_user.organization_id and key.organization_id != current_user.organization_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="API key not found"
        )
    api_key_repo.delete(db, key_id)
    return {"message": "API key revoked", "id": key_id}
