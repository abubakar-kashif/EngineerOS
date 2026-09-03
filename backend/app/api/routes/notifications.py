from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.notification import (
    NotificationListResponse,
    NotificationResponse,
)
from app.services import notification_service

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("", response_model=NotificationListResponse)
def list_my_notifications(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return notification_service.list_notifications(db, user.id)


@router.post("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return notification_service.mark_notification_read(db, user.id, notification_id)


@router.post("/read-all")
def mark_all_my_notifications_read(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    updated = notification_service.mark_all_notifications_read(db, user.id)
    return {"message": f"Marked {updated} notification(s) as read.", "updated": updated}
