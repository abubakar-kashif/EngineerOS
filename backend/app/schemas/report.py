from pydantic import BaseModel, ConfigDict, Field


class ReportCreate(BaseModel):
    experiment_id: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=1, max_length=200)
    observations: str = Field(default="", max_length=10000)
    conclusion: str = Field(default="", max_length=10000)


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    experiment_id: str
    title: str
    observations: str
    conclusion: str
    status: str
