from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.resource import Resource
from app.schemas.resource import ResourceListResponse, ResourceResponse


def get_resources(db: Session) -> ResourceListResponse:
    resources = db.execute(
        select(Resource).order_by(Resource.title)
    ).scalars().all()

    items = [ResourceResponse.model_validate(resource) for resource in resources]
    return ResourceListResponse(items=items, total=len(items))


def get_resource(db: Session, resource_id: str) -> ResourceResponse:
    resource = db.execute(
        select(Resource).where(Resource.id == resource_id)
    ).scalar_one_or_none()

    if resource is None:
        raise HTTPException(status_code=404, detail="Resource not found")

    return ResourceResponse.model_validate(resource)
