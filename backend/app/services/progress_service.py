from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.progress import Progress
from app.schemas.progress import (
    ProgressCreate,
    ProgressResponse,
    ProgressSummary,
)

TOTAL_EXPERIMENTS = 10


def get_progress_summary(db: Session) -> ProgressSummary:
    progress_rows = db.execute(
        select(Progress).order_by(Progress.id)
    ).scalars().all()

    completed_experiments = sum(
        row.status == "completed" for row in progress_rows
    )

    overall_progress = round(
        (completed_experiments / TOTAL_EXPERIMENTS) * 100,
        2,
    )

    # Week 1 does not persist quiz submissions as progress records.
    # Therefore these remain honest demo values until a later
    # user-specific progress integration is implemented.
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
