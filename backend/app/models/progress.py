from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Progress(Base):
    """Experiment progress.

    Phase 9 adds per-user ownership: `user_id` is NULL for legacy/global
    (anonymous) rows and set for authenticated users, with one row per
    (user, experiment) pair. Anonymous rows keep the previous behaviour of
    one row per experiment.
    """

    __tablename__ = "progress"
    __table_args__ = (
        UniqueConstraint("user_id", "experiment_id", name="uq_progress_user_experiment"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[str | None] = mapped_column(
        String(32),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    experiment_id: Mapped[str] = mapped_column(
        String(100),
        ForeignKey("experiments.id"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
