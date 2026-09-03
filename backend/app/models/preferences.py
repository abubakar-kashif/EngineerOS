from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class UserPreferences(Base):
    """Account-level preferences (theme, learning defaults, notifications).

    A single row per user, created together with the account. The theme is
    stored here so a user's dark/light/system choice follows their account
    across devices and logins.
    """

    __tablename__ = "user_preferences"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )

    theme: Mapped[str] = mapped_column(
        String(10), nullable=False, default="dark"
    )
    preferred_difficulty: Mapped[str] = mapped_column(
        String(30), nullable=False, default="Beginner"
    )
    learning_reminders: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    default_experiment_view: Mapped[str] = mapped_column(
        String(20), nullable=False, default="overview"
    )

    notify_quiz_results: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    notify_report_completion: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    notify_learning_reminders: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    notify_email: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    notify_activity: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    user = relationship("User", back_populates="preferences")

    def __repr__(self):
        return f"<UserPreferences user={self.user_id}>"
