from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.simulation import (
    SimulationRunCreateRequest,
    SimulationRunResponse,
    SimulationRunUpdateRequest,
)
from app.services import simulation_service

router = APIRouter(prefix="/api/simulations", tags=["Simulations"])


@router.get("", response_model=list[SimulationRunResponse])
def list_simulation_runs(
    experiment_id: str | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return simulation_service.list_runs(db, user.id, experiment_id)


@router.post("", response_model=SimulationRunResponse, status_code=201)
def create_simulation_run(
    payload: SimulationRunCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return simulation_service.create_run(db, user.id, payload)


@router.get("/{run_id}", response_model=SimulationRunResponse)
def get_simulation_run(
    run_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return simulation_service.get_run(db, user.id, run_id)


@router.patch("/{run_id}", response_model=SimulationRunResponse)
def update_simulation_run(
    run_id: str,
    payload: SimulationRunUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return simulation_service.update_run(db, user.id, run_id, payload)


@router.delete("/{run_id}", status_code=204)
def delete_simulation_run(
    run_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    simulation_service.delete_run(db, user.id, run_id)
