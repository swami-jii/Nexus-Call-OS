from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.auth.deps import get_current_user
from backend.database.session import get_db
from backend.models.models import User, WorkspaceSettings
from backend.repositories.repositories import settings_repo
from backend.schemas.schemas import SettingsUpdate

router = APIRouter(prefix="/api/settings", tags=["Workspace Governance Settings"])


@router.get("")
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    setting = (
        db.query(WorkspaceSettings)
        .filter(WorkspaceSettings.organization_id == current_user.organization_id)
        .first()
    )
    if not setting:
        setting = settings_repo.create(
            db,
            {
                "organization_id": current_user.organization_id,
                "timezone": "America/Los_Angeles",
                "language": "en-US",
                "default_tts_engine": "ElevenLabs Turbo v2.5",
                "default_codec": "Opus 48kHz Stereo",
                "webhook_url": "https://api.nexus.ai/webhooks/voice",
                "webhook_secret": "whsec_98a723b109283401923840192384",
            },
        )
    return setting


@router.put("")
@router.patch("")
def update_settings(
    settings_in: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    setting = (
        db.query(WorkspaceSettings)
        .filter(WorkspaceSettings.organization_id == current_user.organization_id)
        .first()
    )
    if not setting:
        setting = settings_repo.create(
            db, {"organization_id": current_user.organization_id}
        )
    return settings_repo.update(db, setting, settings_in.model_dump(exclude_unset=True))
