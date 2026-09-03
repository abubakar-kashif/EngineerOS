from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

from app.services.engine_adapter import run_engine
from app.models.simulation import Simulation, SimulationStatus
from app.schemas.simulation import SimulationCreate, SimulationUpdate

def generate_id() -> str:
    """Generate a unique simulation ID"""
    return f"sim-{uuid.uuid4().hex[:8]}"

def get_simulation(db: Session, simulation_id: str, user_id: str) -> Optional[Simulation]:
    """Get a simulation by ID (with ownership check)"""
    return db.query(Simulation).filter(
        Simulation.id == simulation_id,
        Simulation.user_id == user_id
    ).first()

def get_user_simulations(
    db: Session,
    user_id: str,
    skip: int = 0,
    limit: int = 100
) -> List[Simulation]:
    """Get all simulations for a user"""
    return db.query(Simulation).filter(
        Simulation.user_id == user_id
    ).offset(skip).limit(limit).all()

def create_simulation(
    db: Session,
    user_id: str,
    simulation: SimulationCreate
) -> Simulation:
    """Create a new simulation"""
    db_simulation = Simulation(
        id=generate_id(),
        user_id=user_id,
        name=simulation.name,
        experiment_id=simulation.experiment_id,
        circuit_definition=simulation.circuit_definition,
        status=SimulationStatus.IDLE
    )
    db.add(db_simulation)
    db.commit()
    db.refresh(db_simulation)
    return db_simulation

def update_simulation(
    db: Session,
    simulation_id: str,
    user_id: str,
    simulation_update: SimulationUpdate
) -> Optional[Simulation]:
    """Update a simulation"""
    db_simulation = get_simulation(db, simulation_id, user_id)
    if not db_simulation:
        return None
    
    update_data = simulation_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_simulation, key, value)
    
    db_simulation.updated_at = datetime.now()
    db.commit()
    db.refresh(db_simulation)
    return db_simulation

def delete_simulation(
    db: Session,
    simulation_id: str,
    user_id: str
) -> bool:
    """Delete a simulation"""
    db_simulation = get_simulation(db, simulation_id, user_id)
    if not db_simulation:
        return False
    
    db.delete(db_simulation)
    db.commit()
    return True

def update_simulation_status(
    db: Session,
    simulation_id: str,
    user_id: str,
    status: SimulationStatus
) -> Optional[Simulation]:
    """Update simulation status"""
    db_simulation = get_simulation(db, simulation_id, user_id)
    if not db_simulation:
        return None
    
    db_simulation.status = status
    if status == SimulationStatus.COMPLETED or status == SimulationStatus.FAILED:
        db_simulation.completed_at = datetime.now()
    
    db.commit()
    db.refresh(db_simulation)
    return db_simulation

def save_simulation_result(
    db: Session,
    simulation_id: str,
    user_id: str,
    result: Dict[str, Any]
) -> Optional[Simulation]:
    """Save simulation results (full result)"""
    db_simulation = get_simulation(db, simulation_id, user_id)
    if not db_simulation:
        return None
    
    # Store the full result
    db_simulation.results = result
    db_simulation.measurements = result.get("measurements")
    
    # Extract validation errors from the new nested structure
    validation = result.get("validation", {})
    db_simulation.validation_errors = validation.get("errors", [])
    
    # Map engine status to our enum
    status = result.get("status")
    if status == "completed":
        db_simulation.status = SimulationStatus.COMPLETED
        db_simulation.completed_at = datetime.now()
    elif status == "invalid":
        db_simulation.status = SimulationStatus.INVALID
    elif status == "failed":
        db_simulation.status = SimulationStatus.FAILED
    else:
        db_simulation.status = SimulationStatus.READY  # fallback
    
    db.commit()
    db.refresh(db_simulation)
    return db_simulation

def validate_simulation(db: Session, simulation_id: str, user_id: str):
    """
    Validate a simulation circuit using the engine.
    Returns only the validation result (valid, errors, warnings).
    Updates simulation status and validation_errors, but does NOT store full results/measurements.
    """
    simulation = get_simulation(db, simulation_id, user_id)
    if not simulation:
        return None
    if not simulation.circuit_definition:
        return {"valid": False, "errors": [{"message": "No circuit definition"}]}
    
    # Run the engine – this returns the full result, but we only care about validation
    full_result = run_engine(simulation.circuit_definition)
    validation = full_result.get("validation", {})
    
    # Update simulation status based on validation
    if validation.get("valid", False):
        simulation.status = SimulationStatus.READY
    else:
        simulation.status = SimulationStatus.INVALID
    simulation.validation_errors = validation.get("errors", [])
    db.commit()
    
    # Return only the validation part (matches ValidationResponse schema)
    return validation

def run_simulation(db: Session, simulation_id: str, user_id: str):
    """
    Run a simulation using the engine.
    Returns the full result, persists it (results, measurements, validation_errors, status, completed_at).
    """
    simulation = get_simulation(db, simulation_id, user_id)
    if not simulation:
        return None
    if not simulation.circuit_definition:
        return {"status": "failed", "error": "No circuit definition"}
    
    # Execute the engine
    result = run_engine(simulation.circuit_definition)
    
    # Persist the full result
    db_simulation = simulation  # alias for clarity
    db_simulation.results = result
    db_simulation.measurements = result.get("measurements", {})
    
    # Extract validation errors from the new nested structure
    validation = result.get("validation", {})
    db_simulation.validation_errors = validation.get("errors", [])
    
    # Map engine status to our enum
    engine_status = result.get("status")
    if engine_status == "completed":
        db_simulation.status = SimulationStatus.COMPLETED
        db_simulation.completed_at = datetime.now()
    elif engine_status == "invalid":
        db_simulation.status = SimulationStatus.INVALID
    elif engine_status == "failed":
        db_simulation.status = SimulationStatus.FAILED
    else:
        db_simulation.status = SimulationStatus.READY  # fallback
    
    db.commit()
    
    return result