"""Simulation run persistence with full circuit definition + results.

Handles CRUD for simulation sessions including circuit schematic,
validation state, solver output, and measurements.
"""

from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.simulation import SimulationRun
from app.schemas.simulation import (
    SimulationRunCreateRequest,
    SimulationRunUpdateRequest,
)


def _get_owned_run(db: Session, user_id: str, run_id: str) -> SimulationRun:
    run = (
        db.execute(
            select(SimulationRun).where(
                SimulationRun.id == run_id,
                SimulationRun.user_id == user_id,
            )
        )
        .scalars()
        .one_or_none()
    )

    if run is None:
        raise HTTPException(status_code=404, detail="Simulation run not found")

    return run


def list_runs(db: Session, user_id: str, experiment_id: str | None = None):
    query = select(SimulationRun).where(SimulationRun.user_id == user_id)
    if experiment_id:
        query = query.where(SimulationRun.experiment_id == experiment_id)

    return (
        db.execute(query.order_by(SimulationRun.created_at.desc()))
        .scalars()
        .all()
    )


def create_run(db: Session, user_id: str, payload: SimulationRunCreateRequest):
    run = SimulationRun(
        user_id=user_id,
        experiment_id=payload.experiment_id,
        name=payload.name,
        configuration=payload.configuration,
        circuit_definition=payload.circuit_definition,
        status=payload.status,
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


def get_run(db: Session, user_id: str, run_id: str):
    return _get_owned_run(db, user_id, run_id)


def update_run(
    db: Session,
    user_id: str,
    run_id: str,
    payload: SimulationRunUpdateRequest,
):
    run = _get_owned_run(db, user_id, run_id)

    if payload.name is not None:
        run.name = payload.name
    if payload.configuration is not None:
        run.configuration = payload.configuration
    if payload.circuit_definition is not None:
        run.circuit_definition = payload.circuit_definition
    if payload.validation_errors is not None:
        run.validation_errors = payload.validation_errors
    if payload.results is not None:
        run.results = payload.results
    if payload.measurements is not None:
        run.measurements = payload.measurements
    if payload.status is not None:
        run.status = payload.status
    if payload.completed:
        run.completed_at = datetime.utcnow()

    run.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(run)
    return run


def delete_run(db: Session, user_id: str, run_id: str) -> None:
    run = _get_owned_run(db, user_id, run_id)
    db.delete(run)
    db.commit()
