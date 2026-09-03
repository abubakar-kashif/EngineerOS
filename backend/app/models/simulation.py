from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base
from app.models.user import generate_uuid


class SimulationRun(Base):
    """Persisted simulation session with full circuit definition + results.

    Stores the circuit schematic, validation state, solver output, and
    measurements so the frontend can save / load / review simulations.
    """

    __tablename__ = "simulation_runs"

    id: Mapped[str] = mapped_column(
        String(32), primary_key=True, default=generate_uuid, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    experiment_id: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
    )
    name: Mapped[str | None] = mapped_column(
        String(200), nullable=True
    )
    configuration: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    circuit_definition: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    validation_errors: Mapped[list | None] = mapped_column(JSON, nullable=True)
    results: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    measurements: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="created"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True, onupdate=datetime.utcnow
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )

    def __repr__(self):
        return f"<SimulationRun {self.id} status={self.status}>"
