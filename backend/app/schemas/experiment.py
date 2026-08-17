from pydantic import BaseModel, ConfigDict
from typing import List


class ExperimentResponse(BaseModel):
    id: str
    title: str
    slug: str
    short_description: str | None = None
    description: str | None = None
    objective: str | None = None
    theory: str | None = None
    difficulty: str
    category: str
    duration_minutes: int
    status: str

    model_config = ConfigDict(from_attributes=True)


class ExperimentListResponse(BaseModel):
    items: List[ExperimentResponse]
    total: int