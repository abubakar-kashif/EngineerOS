from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field, field_serializer


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    title: str
    message: str
    read: bool
    created_at: datetime
    # ORM attribute is `meta` ("metadata" is reserved in SQLAlchemy); the
    # API field stays `metadata` as specified in the Phase 9 contract.
    metadata: dict | None = Field(default=None, validation_alias="meta")

    @field_serializer("created_at")
    def _serialize_created_at(self, value: datetime) -> datetime:
        # Rows store naive UTC (`datetime.utcnow`); expose them as
        # timezone-aware UTC so clients cannot misread them as local time.
        return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)


class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    unread_count: int
    total: int
