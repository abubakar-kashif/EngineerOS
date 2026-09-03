from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_serializer


ProgressStatus = Literal["in_progress", "completed"]


class ProgressCreate(BaseModel):
    experiment_id: str = Field(min_length=1, max_length=100)
    status: ProgressStatus


class ProgressResponse(BaseModel):
    id: int
    experiment_id: str
    status: ProgressStatus
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("updated_at")
    def _serialize_updated_at(self, value: datetime) -> datetime:
        # Naive UTC (SQLite default) → timezone-aware so clients read it as UTC.
        return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


class ProgressSummary(BaseModel):
    completed_experiments: int
    completed_quizzes: int
    average_quiz_score: float
    overall_progress: float
