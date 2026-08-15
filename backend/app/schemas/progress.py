from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


ProgressStatus = Literal["in_progress", "completed"]


class ProgressCreate(BaseModel):
    experiment_id: str = Field(min_length=1, max_length=100)
    status: ProgressStatus


class ProgressResponse(BaseModel):
    id: int
    experiment_id: str
    status: ProgressStatus

    model_config = ConfigDict(from_attributes=True)


class ProgressSummary(BaseModel):
    completed_experiments: int
    completed_quizzes: int
    average_quiz_score: float
    overall_progress: float
