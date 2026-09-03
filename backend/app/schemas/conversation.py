from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

MessageRole = Literal["user", "assistant", "system"]
FeedbackValue = Literal["helpful", "not_helpful"]


class ConversationCreateRequest(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    experiment_id: str | None = Field(default=None, max_length=100)


class ConversationUpdateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)


class MessageCreateRequest(BaseModel):
    role: MessageRole
    content: str = Field(min_length=1, max_length=20000)
    metadata: dict | None = None


class MessageFeedbackRequest(BaseModel):
    feedback: FeedbackValue | None = None


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    conversation_id: str
    role: str
    content: str
    feedback: str | None = None
    # ORM attribute is `meta` ("metadata" is reserved in SQLAlchemy).
    metadata: dict | None = Field(default=None, validation_alias="meta")
    created_at: datetime


class ConversationSummaryResponse(BaseModel):
    """Sidebar projection — everything except the messages themselves."""

    id: str
    title: str
    experiment_id: str | None = None
    created_at: datetime
    updated_at: datetime
    message_count: int = 0


class ConversationDetailResponse(BaseModel):
    id: str
    title: str
    experiment_id: str | None = None
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse] = []
