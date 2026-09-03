from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

SimulationStatus = Literal["created", "running", "completed", "failed"]


class SimulationRunCreateRequest(BaseModel):
    experiment_id: str = Field(min_length=1, max_length=100)
    name: str | None = Field(default=None, max_length=200)
    configuration: dict | None = None
    circuit_definition: dict | None = None
    status: SimulationStatus = "created"


class SimulationRunUpdateRequest(BaseModel):
    name: str | None = None
    configuration: dict | None = None
    circuit_definition: dict | None = None
    validation_errors: list | None = None
    results: dict | None = None
    measurements: dict | None = None
    status: SimulationStatus | None = None
    completed: bool | None = None


class SimulationRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    experiment_id: str
    name: str | None = None
    configuration: dict | None = None
    circuit_definition: dict | None = None
    validation_errors: list | None = None
    results: dict | None = None
    measurements: dict | None = None
    status: str
    created_at: datetime
    updated_at: datetime | None = None
    completed_at: datetime | None = None
