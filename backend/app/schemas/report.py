from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReportCreate(BaseModel):
    """Client-supplied report fields.

    Everything else in the lab document (content sections, measured values,
    quiz performance) is assembled server-side from real data — the client
    only contributes its own observations and conclusion.
    """

    experiment_id: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=1, max_length=200)
    observations: str = Field(default="", max_length=10000)
    conclusion: str = Field(default="", max_length=10000)


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str | None = None
    experiment_id: str
    # Not stored on the row — filled in by the service from the experiment.
    # Defaults to "" so model_validate(report) works before it is set.
    experiment_title: str = ""
    student_name: str | None = None
    title: str

    # ── Content sections copied from the experiment ──
    objective: str | None = None
    theory: str | None = None
    historical_background: str | None = None
    components: list | None = None
    circuit_diagram: dict | None = None
    procedure: list | None = None
    theoretical_results: dict | None = None

    # ── Data recorded from the user's own work (never fabricated) ──
    measured_results: list | None = None
    calculated_results: list | None = None
    percentage_error: list | None = None
    quiz_performance: dict | None = None

    observations: str
    conclusion: str
    status: str
    created_at: datetime
