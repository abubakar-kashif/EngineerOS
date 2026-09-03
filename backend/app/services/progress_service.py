from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.experiment import Experiment
from app.models.progress import Progress
from app.models.quiz import QuizAttempt
from app.models.user import User
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


def get_progress_summary(db: Session, user: User | None = None) -> ProgressSummary:
    """Learning progress summary.

    Authenticated users get their own numbers, including quiz statistics
    derived from their recorded attempts. Anonymous requests keep the
    pre-Phase-9 global behaviour (legacy rows without an owner, quiz stats
    at zero because anonymous submissions are not recorded).
    """
    if user is not None:
        completed_experiments = db.execute(
            select(func.count(Progress.id)).where(
                Progress.user_id == user.id,
                Progress.status == "completed",
            )
        ).scalar_one()

        attempts = db.execute(
            select(QuizAttempt.score).where(QuizAttempt.user_id == user.id)
        ).scalars().all()
        completed_quizzes = len(attempts)
        average_quiz_score = (
            round(sum(attempts) / len(attempts), 2) if attempts else 0.0
        )
    else:
        completed_experiments = db.execute(
            select(func.count(Progress.id)).where(
                Progress.user_id.is_(None),
                Progress.status == "completed",
            )
        ).scalar_one()

        completed_quizzes = 0
        average_quiz_score = 0.0

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
        completed_quizzes=completed_quizzes,
        average_quiz_score=average_quiz_score,
        overall_progress=overall_progress,
    )


def upsert_progress(
    db: Session,
    payload: ProgressCreate,
    user: User | None = None,
) -> ProgressResponse:
    """Create or update progress for one experiment.

    Authenticated users get their own row per experiment; anonymous requests
    keep writing the shared legacy row (user_id NULL) as before.
    """
    _ensure_experiment_exists(db, payload.experiment_id)

    query = select(Progress).where(Progress.experiment_id == payload.experiment_id)
    if user is not None:
        query = query.where(Progress.user_id == user.id)
    else:
        query = query.where(Progress.user_id.is_(None))

    progress = db.execute(query).scalar_one_or_none()

    if progress is None:
        progress = Progress(
            user_id=user.id if user is not None else None,
            experiment_id=payload.experiment_id,
            status=payload.status,
        )
        db.add(progress)
    else:
        progress.status = payload.status

    db.commit()
    db.refresh(progress)

    return ProgressResponse.model_validate(progress)


def list_user_progress(db: Session, user: User) -> list[ProgressResponse]:
    """Per-experiment progress rows for the authenticated user."""
    rows = (
        db.execute(
            select(Progress)
            .where(Progress.user_id == user.id)
            .order_by(Progress.experiment_id)
        )
        .scalars()
        .all()
    )

    return [ProgressResponse.model_validate(row) for row in rows]
