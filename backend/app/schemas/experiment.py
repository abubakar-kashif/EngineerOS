from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ExperimentBase(BaseModel):
    name: str
    slug: str
    title: str
    short_description: Optional[str] = None
    description: Optional[str] = None
    objective: Optional[str] = None
    theory: Optional[str] = None
    difficulty: str
    category: str
    duration_minutes: int = 30
    status: str = "draft"

class ExperimentCreate(ExperimentBase):
    pass

class ExperimentResponse(ExperimentBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True