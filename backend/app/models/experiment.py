from sqlalchemy import JSON, Column, String, Text, DateTime, Integer
from sqlalchemy.sql import func
from app.db.database import Base

class Experiment(Base):
    """An experiment catalog entry.

    Rich educational content (lists of formulas, procedure steps,
    safety notes, …) is stored as JSON columns; prose stays as Text.
    """

    __tablename__ = "experiments"

    id = Column(String, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    short_description = Column(String(500))
    description = Column(Text)
    objective = Column(Text)
    theory = Column(Text)
    difficulty = Column(String(50), nullable=False)
    category = Column(String(100), nullable=False)
    duration_minutes = Column(Integer, default=30)
    status = Column(String(50), default="draft")

    # Phase 4 — structured educational content (JSON columns)
    historical_background = Column(Text)
    learning_outcomes = Column(JSON)
    prerequisites = Column(JSON)
    formulas = Column(JSON)
    variables = Column(JSON)
    components = Column(JSON)
    circuit_diagram = Column(JSON)
    procedure = Column(JSON)
    expected_results = Column(JSON)
    common_mistakes = Column(JSON)
    safety_precautions = Column(JSON)
    observation_guidance = Column(JSON)
    real_world_applications = Column(JSON)
    related_experiments = Column(JSON)
    simulation_configuration = Column(JSON)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Experiment {self.title}>"