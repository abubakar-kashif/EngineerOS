from sqlalchemy import Column, String, DateTime, JSON, Enum, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base
import enum
import uuid

class SimulationStatus(str, enum.Enum):
    IDLE = "idle"
    READY = "ready"
    RUNNING = "running"
    COMPLETED = "completed"
    INVALID = "invalid"
    FAILED = "failed"

class Simulation(Base):
    __tablename__ = "simulations"

    id = Column(String(100), primary_key=True, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    experiment_id = Column(String(100), nullable=True, index=True)
    name = Column(String(200), nullable=False, default="Untitled Simulation")
    circuit_definition = Column(JSON, nullable=True)
    status = Column(Enum(SimulationStatus), default=SimulationStatus.IDLE)
    validation_errors = Column(JSON, nullable=True)
    measurements = Column(JSON, nullable=True)
    results = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<Simulation {self.name} ({self.status})>"


class SimulationRun(Base):
    """
    Persisted simulation session with full circuit definition + results.
    Stores the circuit schematic, validation state, solver output, and
    measurements so the frontend can save / load / review simulations.
    """
    __tablename__ = "simulation_runs"

    id = Column(
        String(32),
        primary_key=True,
        index=True,
        default=lambda: uuid.uuid4().hex[:32]
    )
    user_id = Column(
        String(32),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    experiment_id = Column(
        String(100),
        nullable=False,
        index=True
    )
    name = Column(
        String(200),
        nullable=True
    )
    configuration = Column(JSON, nullable=True)
    circuit_definition = Column(JSON, nullable=True)
    validation_errors = Column(JSON, nullable=True)
    results = Column(JSON, nullable=True)
    measurements = Column(JSON, nullable=True)
    status = Column(
        String(30),
        nullable=False,
        default="created"
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<SimulationRun {self.id} ({self.status})>"