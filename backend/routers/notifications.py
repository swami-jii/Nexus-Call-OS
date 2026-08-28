from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.auth.deps import get_current_user
from backend.database.session import get_db
from backend.models.models import User
from backend.repositories.repositories import notification_repo
from backend.schemas.schemas import NotificationCreate, NotificationOut

router = APIRouter(prefix="/api/notifications", tags=["Notifications & Alerts"])


@router.get("")
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = notification_repo.get_multi(
        db, limit=50, filters={"user_id": current_user.id}
    )
    return items


@router.post("", response_model=NotificationOut, status_code=status.HTTP_201_CREATED)
def create_notification(
    notif_in: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = notif_in.model_dump()
    data["user_id"] = current_user.id
    return notification_repo.create(db, data)


@router.post("/{notification_id}/read")
def mark_as_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notif = notification_repo.get_by_id(db, notification_id)
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "Notification marked as read", "id": notification_id}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notif = notification_repo.get_by_id(db, notification_id)
    if notif:
        notification_repo.delete(db, notification_id)
    return {"message": "Notification deleted", "id": notification_id}
