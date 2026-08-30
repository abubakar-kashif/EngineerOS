from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class SimulationStatus(str, Enum):
    IDLE = "idle"
    READY = "ready"
    RUNNING = "running"
    COMPLETED = "completed"
    INVALID = "invalid"
    FAILED = "failed"

# === Base Schema ===
class SimulationBase(BaseModel):
    name: str = "Untitled Simulation"
    experiment_id: Optional[str] = None
    circuit_definition: Optional[Dict[str, Any]] = None

# === Create Simulation ===
class SimulationCreate(SimulationBase):
    pass

# === Update Simulation ===
class SimulationUpdate(BaseModel):
    name: Optional[str] = None
    circuit_definition: Optional[Dict[str, Any]] = None
    status: Optional[SimulationStatus] = None

# === Response Schema ===
class SimulationResponse(SimulationBase):
    id: str
    user_id: str
    status: SimulationStatus
    validation_errors: Optional[List[Dict[str, Any]]] = None
    measurements: Optional[Dict[str, Any]] = None
    results: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# === Run Simulation Request ===
class RunSimulationRequest(BaseModel):
    circuit_definition: Dict[str, Any]

# === Validation Response ===
class ValidationResponse(BaseModel):
    valid: bool
    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []

# === Simulation Result ===
class SimulationResult(BaseModel):
    status: SimulationStatus
    measurements: Optional[Dict[str, Any]] = None
    results: Optional[Dict[str, Any]] = None
    validation_errors: Optional[List[Dict[str, Any]]] = None
    warnings: Optional[List[Dict[str, Any]]] = None