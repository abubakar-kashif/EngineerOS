from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.models.user import generate_uuid


class Conversation(Base):
    """AI Mentor conversation, owned by exactly one user.

    The AI engine itself is not implemented yet — this is the persistence
    foundation the future LLM integration will write into.
    """

    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(
        String(32), primary_key=True, default=generate_uuid, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    experiment_id: Mapped[str | None] = mapped_column(
        String(100), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    messages = relationship(
        "ConversationMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="ConversationMessage.created_at",
    )

    def __repr__(self):
        return f"<Conversation {self.id}>"


class ConversationMessage(Base):
    """A single message inside a conversation.

    Roles: `user`, `assistant`, `system`. `metadata` is a free-form JSON
    object (e.g. streaming status, simulation flags) so the future AI engine
    can attach information without schema changes.
    """

    __tablename__ = "conversation_messages"

    id: Mapped[str] = mapped_column(
        String(32), primary_key=True, default=generate_uuid, index=True
    )
    conversation_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    feedback: Mapped[str | None] = mapped_column(String(20), nullable=True)
    meta: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    conversation = relationship("Conversation", back_populates="messages")

    def __repr__(self):
        return f"<ConversationMessage {self.id} role={self.role}>"
