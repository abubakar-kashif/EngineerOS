from sqlalchemy.orm import Session

from app.models.experiment import Experiment


def get_all_experiments(
    db: Session,
    skip: int = 0,
    limit: int = 100,
):
    """Get all experiments with pagination."""

    query = db.query(Experiment)

    total = query.count()

    experiments = (
        query
        .offset(skip)
        .limit(limit)
        .all()
    )

    return experiments, total


def get_experiment_by_id(
    db: Session,
    experiment_id: str,
):
    """Get a single experiment by ID."""

    return (
        db.query(Experiment)
        .filter(Experiment.id == experiment_id)
        .first()
    )