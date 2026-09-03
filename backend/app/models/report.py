from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Report(Base):
    """Lab report — a snapshot of a full engineering lab document.

    Phase 9 added ownership: authenticated users create reports with their
    `user_id` set and see only their own reports. Anonymous requests keep
    the previous global behaviour (ownerless rows).

    Phase 7 structures the report as a real lab document: content sections
    are copied from the experiment at generation time, measured values are
    pulled from the user's latest simulation run, and quiz performance from
    their latest quiz attempt. Anything without a real source stays NULL —
    missing measurements are never fabricated.
    """

    __tablename__ = "reports"

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
    title: Mapped[str] = mapped_column(String(200), nullable=False)

    # ── Lab document header ──
    student_name: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # ── Content sections copied from the experiment ──
    objective: Mapped[str | None] = mapped_column(Text, nullable=True)
    theory: Mapped[str | None] = mapped_column(Text, nullable=True)
    historical_background: Mapped[str | None] = mapped_column(Text, nullable=True)
    components: Mapped[list | None] = mapped_column(JSON, nullable=True)
    circuit_diagram: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    procedure: Mapped[list | None] = mapped_column(JSON, nullable=True)
    theoretical_results: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # ── Data recorded from the user's own work ──
    measured_results: Mapped[list | None] = mapped_column(JSON, nullable=True)
    calculated_results: Mapped[list | None] = mapped_column(JSON, nullable=True)
    percentage_error: Mapped[list | None] = mapped_column(JSON, nullable=True)
    quiz_performance: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    observations: Mapped[str] = mapped_column(Text, nullable=False, default="")
    conclusion: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="generated")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
