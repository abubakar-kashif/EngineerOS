from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.resource import ResourceListResponse, ResourceResponse
from app.services.resource_service import get_resource, get_resources

router = APIRouter(prefix="/api/resources", tags=["Resources"])


@router.get("", response_model=ResourceListResponse)
def list_resources(db: Session = Depends(get_db)):
    return get_resources(db)


@router.get("/{resource_id}", response_model=ResourceResponse)
def get_resource_endpoint(
    resource_id: str,
    db: Session = Depends(get_db),
):
    return get_resource(db, resource_id)
