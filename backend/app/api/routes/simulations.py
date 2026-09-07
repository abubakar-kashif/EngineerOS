from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.schemas.simulation import (
    SimulationCreate,
    SimulationUpdate,
    SimulationResponse,
    RunSimulationRequest,
    ValidationResponse,
    SimulationResult
)
from app.services.simulation_service import (
    get_simulation,
    get_user_simulations,
    create_simulation,
    update_simulation,
    delete_simulation,
    save_simulation_result,
    validate_simulation,
    run_simulation
)
from app.models.simulation import SimulationStatus
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/simulations", tags=["simulations"])

@router.get("/", response_model=List[SimulationResponse])
def list_simulations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all simulations for the current user"""
    return get_user_simulations(db, current_user.id, skip=skip, limit=limit)

@router.post("/", response_model=SimulationResponse, status_code=status.HTTP_201_CREATED)
def create_simulation_route(
    simulation: SimulationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new simulation"""
    return create_simulation(db, current_user.id, simulation)

@router.get("/{simulation_id}", response_model=SimulationResponse)
def get_simulation_route(
    simulation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific simulation"""
    simulation = get_simulation(db, simulation_id, current_user.id)
    if not simulation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Simulation with ID '{simulation_id}' not found"
        )
    return simulation

@router.patch("/{simulation_id}", response_model=SimulationResponse)
def update_simulation_route(
    simulation_id: str,
    simulation_update: SimulationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a simulation"""
    updated = update_simulation(db, simulation_id, current_user.id, simulation_update)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Simulation with ID '{simulation_id}' not found"
        )
    return updated

@router.delete("/{simulation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_simulation_route(
    simulation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a simulation"""
    deleted = delete_simulation(db, simulation_id, current_user.id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Simulation with ID '{simulation_id}' not found"
        )
    return None

@router.post("/{simulation_id}/validate", response_model=ValidationResponse)
def validate_simulation_route(
    simulation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Validate a simulation circuit using the Person 1 engine"""
    result = validate_simulation(db, simulation_id, current_user.id)
    if result is None:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return ValidationResponse(
        valid=result.get("valid", False),
        errors=result.get("errors", []),
        warnings=result.get("warnings", [])
    )

@router.post("/{simulation_id}/run", response_model=SimulationResult)
def run_simulation_route(
    simulation_id: str,
    request: RunSimulationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Run a simulation using the Person 1 engine"""
    result = run_simulation(
        db,
        simulation_id,
        current_user.id,
        circuit_definition=request.circuit_definition,
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return result