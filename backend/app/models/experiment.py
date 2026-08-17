from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    short_description = Column(String(500))
    description = Column(Text)
    objective = Column(Text)
    theory = Column(Text)
    difficulty = Column(String(50), nullable=False)
    category = Column(String(100), nullable=False)
    duration_minutes = Column(Integer, default=30)
    status = Column(String(50), default="draft")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
