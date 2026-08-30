from sqlalchemy import Column, String, Text, DateTime, JSON, Enum, Integer
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base
import enum

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
    
    # Circuit definition (JSON)
    circuit_definition = Column(JSON, nullable=True)
    
    # Status
    status = Column(Enum(SimulationStatus), default=SimulationStatus.IDLE)
    
    # Results
    validation_errors = Column(JSON, nullable=True)  # List of validation errors
    measurements = Column(JSON, nullable=True)       # Measurement results
    results = Column(JSON, nullable=True)            # Full simulation results
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<Simulation {self.name} ({self.status})>"