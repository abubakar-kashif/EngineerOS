from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.experiment import Experiment
from app.models.progress import Progress
from app.schemas.progress import (
    ProgressCreate,
    ProgressResponse,
    ProgressSummary,
)


def _ensure_experiment_exists(db: Session, experiment_id: str) -> None:
    exists = db.execute(
        select(Experiment.id).where(Experiment.id == experiment_id)
    ).scalar_one_or_none()

    if exists is None:
        raise HTTPException(
            status_code=404,
            detail="Experiment not found",
        )


def get_progress_summary(db: Session) -> ProgressSummary:
    completed_experiments = db.execute(
        select(func.count(Progress.id)).where(
            Progress.status == "completed"
        )
    ).scalar_one()

    total_experiments = db.execute(
        select(func.count(Experiment.id))
    ).scalar_one()

    overall_progress = (
        round((completed_experiments / total_experiments) * 100, 2)
        if total_experiments
        else 0.0
    )

    return ProgressSummary(
        completed_experiments=completed_experiments,
        completed_quizzes=0,
        average_quiz_score=0.0,
        overall_progress=overall_progress,
    )


def upsert_progress(
    db: Session,
    payload: ProgressCreate,
) -> ProgressResponse:
    _ensure_experiment_exists(db, payload.experiment_id)

    progress = db.execute(
        select(Progress).where(
            Progress.experiment_id == payload.experiment_id
        )
    ).scalar_one_or_none()

    if progress is None:
        progress = Progress(
            experiment_id=payload.experiment_id,
            status=payload.status,
        )
        db.add(progress)
    else:
        progress.status = payload.status

    db.commit()
    db.refresh(progress)

    return ProgressResponse.model_validate(progress)
