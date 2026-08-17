from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.schemas.experiment import ExperimentResponse, ExperimentCreate, ExperimentListResponse
from app.services import experiment_service

router = APIRouter(prefix="/api/experiments", tags=["experiments"])

@router.get("/", response_model=ExperimentListResponse)
def get_experiments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all experiments"""
    experiments, total = experiment_service.get_all_experiments(db, skip=skip, limit=limit)
    return {
        "items": experiments,
        "total": total
    }

@router.get("/{experiment_id}", response_model=ExperimentResponse)
def get_experiment(
    experiment_id: str,
    db: Session = Depends(get_db)
):
    """Get a single experiment by ID"""
    experiment = experiment_service.get_experiment_by_id(db, experiment_id)
    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment with ID '{experiment_id}' not found"
        )
    return experiment

@router.post("/", response_model=ExperimentResponse, status_code=status.HTTP_201_CREATED)
def create_experiment(
    experiment: ExperimentCreate,
    db: Session = Depends(get_db)
):
    """Create a new experiment"""
    return experiment_service.create_experiment(db, experiment)