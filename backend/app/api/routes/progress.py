from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.progress import (
    ProgressCreate,
    ProgressResponse,
    ProgressSummary,
)
from app.services.progress_service import (
    get_progress_summary,
    upsert_progress,
)

router = APIRouter(
    prefix="/api/progress",
    tags=["Progress"],
)


@router.get("", response_model=ProgressSummary)
def get_progress(
    db: Session = Depends(get_db),
):
    return get_progress_summary(db)


@router.post("", response_model=ProgressResponse)
def update_progress(
    payload: ProgressCreate,
    db: Session = Depends(get_db),
):
    return upsert_progress(db, payload)
