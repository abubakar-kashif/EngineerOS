from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_optional_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.progress import (
    ProgressCreate,
    ProgressResponse,
    ProgressSummary,
)
from app.services.progress_service import (
    get_progress_summary,
    list_user_progress,
    upsert_progress,
)

router = APIRouter(
    prefix="/api/progress",
    tags=["Progress"],
)


@router.get("", response_model=ProgressSummary)
def get_progress(
    user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    return get_progress_summary(db, user)


@router.post("", response_model=ProgressResponse)
def update_progress(
    payload: ProgressCreate,
    user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    return upsert_progress(db, payload, user)


@router.get("/me", response_model=list[ProgressResponse])
def get_my_progress(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Per-experiment progress rows for the signed-in user."""
    return list_user_progress(db, user)
