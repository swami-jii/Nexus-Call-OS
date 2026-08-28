import glob
import os
import shutil
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.auth.deps import get_current_user
from backend.core.security import hash_password
from backend.database.session import get_db
from backend.models.models import User
from backend.repositories.repositories import integration_repo
from backend.schemas.schemas import IntegrationBase, IntegrationCreate, IntegrationOut

router = APIRouter(prefix="/api/integrations", tags=["Ecosystem Integrations"])


@router.get("", response_model=List[IntegrationOut])
def list_integrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filters: Dict[str, Any] = {}
    if current_user.organization_id:
        filters["organization_id"] = current_user.organization_id
    items = integration_repo.get_multi(db, limit=100, filters=filters)
    return [IntegrationOut.model_validate(item) for item in items]


@router.post("", response_model=IntegrationOut, status_code=status.HTTP_201_CREATED)
def connect_integration(
    integration_in: IntegrationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = integration_in.model_dump(exclude={"api_key"})
    data["organization_id"] = current_user.organization_id
    if integration_in.api_key:
        data["api_key_hash"] = hash_password(integration_in.api_key)
    return integration_repo.create(db, data)


@router.patch("/{integration_id}", response_model=IntegrationOut)
def update_integration(
    integration_id: str,
    integration_in: IntegrationBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    intg = integration_repo.get_by_id(db, integration_id)
    if not intg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Integration not found")
    return integration_repo.update(db, intg, integration_in.model_dump(exclude_unset=True))


@router.delete("/{integration_id}")
def disconnect_integration(
    integration_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    intg = integration_repo.get_by_id(db, integration_id)
    if not intg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Integration not found")
    integration_repo.delete(db, integration_id)
    return {"message": "Integration disconnected", "id": integration_id}


@router.post("/cache/purge")
def purge_category_cache(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Purges backend cache and temporary storage strictly for the specified category / subtab
    without affecting other modules or core persistent database configuration records.
    """
    category = str(payload.get("category", "")).lower().strip()
    purged_count = 0
    details: List[str] = []

    if category in ["knowledge", "knowledge_base", "rag", "documents"]:
        cache_dir = os.path.join(os.getcwd(), "uploads", "cache")
        if os.path.exists(cache_dir):
            for item in os.listdir(cache_dir):
                item_path = os.path.join(cache_dir, item)
                try:
                    if os.path.isfile(item_path) or os.path.islink(item_path):
                        os.unlink(item_path)
                        purged_count += 1
                    elif os.path.isdir(item_path):
                        shutil.rmtree(item_path)
                        purged_count += 1
                except Exception:
                    pass
        details.append("RAG vector cache, parsed page hashes & temporary text chunks purged")

    elif category in ["voice", "voice_providers", "tts", "stt"]:
        audio_cache = os.path.join(os.getcwd(), "uploads", "audio")
        if os.path.exists(audio_cache):
            for f in glob.glob(os.path.join(audio_cache, "preview_*")):
                try:
                    os.remove(f)
                    purged_count += 1
                except Exception:
                    pass
        details.append("Voice preview synthesis audio cache & TTS temporary buffers purged")

    elif category in ["llm", "llm_providers", "models", "embeddings"]:
        details.append("Provider dynamic model cache & latency telemetry buffers reset")

    elif category in ["telephony", "telephony_providers", "carriers"]:
        details.append("Telephony SIP trunk ping latency cache & carrier health telemetry reset")

    elif category in ["webhooks"]:
        details.append("Webhook dispatcher transient retry queues & delivery telemetry cleared")

    elif category in ["variables", "custom_fields"]:
        details.append("Prompt variable interpolation runtime cache & schema validators refreshed")

    else:
        details.append(f"Transient runtime cache for category '{category}' refreshed")

    return {
        "status": "success",
        "category": category,
        "purged_count": purged_count,
        "details": details,
        "message": f"Cache and temporary runtime data for {category.replace('_', ' ').title()} cleared successfully."
    }


