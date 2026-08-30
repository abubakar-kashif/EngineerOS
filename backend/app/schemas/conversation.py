from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class MessageCreate(BaseModel):
    role: str  # user, assistant, system
    content: str
    extra_data: Optional[dict] = None


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    extra_data: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationCreate(BaseModel):
    title: Optional[str] = None
    user_id: Optional[str] = None


class ConversationResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    title: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    messages: Optional[List[MessageResponse]] = None

    class Config:
        from_attributes = True


class ConversationListResponse(BaseModel):
    items: List[ConversationResponse]
    total: int
    skip: int
    limit: int

class ConversationRename(BaseModel):
    title: str