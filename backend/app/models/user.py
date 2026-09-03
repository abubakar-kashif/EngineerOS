import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


def generate_uuid() -> str:
    return uuid.uuid4().hex


class User(Base):
    """Authenticated account.

    Passwords are stored as salted PBKDF2 hashes only — the hash (or the
    plaintext password) is never returned by any API response.
    """

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(32), primary_key=True, default=generate_uuid, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(
        String(320), unique=True, index=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(500), nullable=False)
    email_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Email verification + password reset codes (single-use, expiring).
    email_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    email_code_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    reset_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    reset_code_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    preferences = relationship(
        "UserPreferences",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    sessions = relationship(
        "SessionToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<User {self.email}>"


class SessionToken(Base):
    """Opaque bearer token session.

    Only a SHA-256 hash of the token is stored, so a leaked database does not
    leak usable credentials. Sessions can be revoked (logout) or expired.
    """

    __tablename__ = "session_tokens"

    id: Mapped[str] = mapped_column(
        String(32), primary_key=True, default=generate_uuid
    )
    user_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    token_hash: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, nullable=False
    )
    # User-Agent of the client that created the session (shown on the
    # Security settings page so users can recognise their devices).
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    user = relationship("User", back_populates="sessions")

    def __repr__(self):
        return f"<SessionToken {self.id}>"
