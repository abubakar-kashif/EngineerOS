from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.simulation import SimulationStatus

# === Validation sub-schemas ===
class ValidationError(BaseModel):
    code: str
    severity: str
    message: str
    suggestedFix: Optional[str] = None

class ValidationResult(BaseModel):
    valid: bool
    errors: List[ValidationError] = []
    warnings: List[ValidationError] = []

# === DC analysis results ===
class DCResult(BaseModel):
    nodeVoltages: Dict[str, float]
    branchCurrents: Dict[str, float]
    power: Optional[float] = None  # <-- make optional

class ComponentMeasurement(BaseModel):
    componentId: str
    type: str
    voltage: float
    current: float
    power: float
    resistance: Optional[float] = None

class Measurements(BaseModel):
    totalVoltage: float
    totalCurrent: float
    totalPower: float
    equivalentResistance: float
    componentMeasurements: List[ComponentMeasurement]

class GraphData(BaseModel):
    # adjust based on engine's graphData.ts
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

# === Core simulation schemas ===
class SimulationBase(BaseModel):
    name: str = "Untitled Simulation"
    experiment_id: Optional[str] = None
    circuit_definition: Optional[Dict[str, Any]] = None

class SimulationCreate(SimulationBase):
    pass

class SimulationUpdate(BaseModel):
    name: Optional[str] = None
    circuit_definition: Optional[Dict[str, Any]] = None
    status: Optional[SimulationStatus] = None

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

# === Request schemas ===
class RunSimulationRequest(BaseModel):
    circuit_definition: Dict[str, Any]

# === Validation response (updated) ===
class ValidationResponse(BaseModel):
    valid: bool
    errors: List[ValidationError] = []
    warnings: List[ValidationError] = []

# === Simulation result (replaced with new structure) ===
class SimulationResult(BaseModel):
    status: SimulationStatus
    validation: Optional[ValidationResult] = None
    dcResult: Optional[DCResult] = None
    measurements: Optional[Measurements] = None
    graphs: Optional[List[GraphData]] = None
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)