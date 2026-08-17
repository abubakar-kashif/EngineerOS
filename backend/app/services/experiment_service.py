from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.experiment import Experiment
from app.schemas.experiment import ExperimentResponse, ExperimentCreate

def get_all_experiments(db: Session, skip: int = 0, limit: int = 100):
    """Get all experiments with pagination"""
    query = db.query(Experiment)
    total = query.count()
    experiments = query.offset(skip).limit(limit).all()
    return experiments, total

def get_experiment_by_id(db: Session, experiment_id: str):
    """Get a single experiment by ID"""
    return db.query(Experiment).filter(Experiment.id == experiment_id).first()

def create_experiment(db: Session, experiment: ExperimentCreate):
    """Create a new experiment"""
    db_experiment = Experiment(**experiment.model_dump())
    db.add(db_experiment)
    db.commit()
    db.refresh(db_experiment)
    return db_experiment