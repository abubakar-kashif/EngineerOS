from pydantic import BaseModel, ConfigDict, Field


class ResourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    type: str
    description: str
    url: str | None = None


class ResourceListResponse(BaseModel):
    items: list[ResourceResponse]
    total: int
