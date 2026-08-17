from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ExperimentBase(BaseModel):
    id: str
    title: str
    slug: str
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
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ExperimentListResponse(BaseModel):
    items: list[ExperimentResponse]
    total: int