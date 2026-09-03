from sqlalchemy.orm import Session
from sqlalchemy.sql import func
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
    """Save simulation results"""
    db_simulation = get_simulation(db, simulation_id, user_id)
    if not db_simulation:
        return None
    
    db_simulation.results = result
    db_simulation.measurements = result.get("measurements")
    db_simulation.validation_errors = result.get("validation_errors")
    
    if result.get("status") == "completed":
        db_simulation.status = SimulationStatus.COMPLETED
        db_simulation.completed_at = datetime.now()
    elif result.get("status") == "invalid":
        db_simulation.status = SimulationStatus.INVALID
    elif result.get("status") == "failed":
        db_simulation.status = SimulationStatus.FAILED
    
    db.commit()
    db.refresh(db_simulation)
    return db_simulation

def validate_simulation(db: Session, simulation_id: str, user_id: str):
    """Validate a simulation circuit using the engine"""
    simulation = get_simulation(db, simulation_id, user_id)
    if not simulation:
        return None
    if not simulation.circuit_definition:
        return {"valid": False, "errors": [{"message": "No circuit definition"}]}
    
    result = run_engine(simulation.circuit_definition)
    validation = result.get("validation", {})
    
    # Update simulation status
    simulation.status = "invalid" if not validation.get("valid") else "ready"
    simulation.validation_errors = validation.get("errors", [])
    db.commit()
    
    return validation

def run_simulation(db: Session, simulation_id: str, user_id: str):
    """Run a simulation using the engine"""
    simulation = get_simulation(db, simulation_id, user_id)
    if not simulation:
        return None
    if not simulation.circuit_definition:
        return {"status": "failed", "error": "No circuit definition"}
    
    result = run_engine(simulation.circuit_definition)
    
    # Save results
    simulation.status = result.get("status", "failed")
    simulation.results = result
    simulation.measurements = result.get("measurements", {})
    simulation.completed_at = func.now()
    db.commit()
    
    return result