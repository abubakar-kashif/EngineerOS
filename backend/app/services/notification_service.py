from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.schemas.notification import (
    NotificationListResponse,
    NotificationResponse,
)

MAX_LISTED = 50


def create_notification(
    db: Session,
    user_id: str,
    type: str,
    title: str,
    message: str = "",
    meta: dict | None = None,
) -> NotificationResponse:
    """Persist a notification for a user (called by server-side events)."""
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        meta=meta or {},
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return NotificationResponse.model_validate(notification)


def list_notifications(db: Session, user_id: str) -> NotificationListResponse:
    notifications = (
        db.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc(), Notification.id.desc())
            .limit(MAX_LISTED)
        )
        .scalars()
        .all()
    )

    unread = sum(1 for item in notifications if not item.read)
    items = [NotificationResponse.model_validate(item) for item in notifications]
    return NotificationListResponse(items=items, unread_count=unread, total=len(items))


def mark_notification_read(
    db: Session, user_id: str, notification_id: int
) -> NotificationResponse:
    notification = (
        db.execute(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
        )
        .scalars()
        .one_or_none()
    )

    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.read = True
    db.commit()
    db.refresh(notification)
    return NotificationResponse.model_validate(notification)


def mark_all_notifications_read(db: Session, user_id: str) -> int:
    result = db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.read.is_(False))
        .values(read=True)
    )
    db.commit()
    return result.rowcount


def purge_expired(now: datetime) -> None:
    """Placeholder for future cleanup jobs (no background worker yet)."""
