from fastapi import APIRouter, HTTPException
from app.db.database import SessionLocal
from app.models.experiment import Experiment

router = APIRouter(
    prefix="/api/experiments",
    tags=["experiments"],
)


@router.get("")
def get_experiments():
    db = SessionLocal()
    try:
        return db.query(Experiment).all()
    finally:
        db.close()


@router.get("/{experiment_id}")
def get_experiment(experiment_id: str):
    db = SessionLocal()
    try:
        experiment = (
            db.query(Experiment)
            .filter(Experiment.id == experiment_id)
            .first()
        )

        if not experiment:
            raise HTTPException(
                status_code=404,
                detail="Experiment not found",
            )

        return experiment
    finally:
        db.close()