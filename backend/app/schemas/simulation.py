from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.simulation import SimulationStatus

# === Validation sub-schemas ===
class ValidationError(BaseModel):
    model_config = ConfigDict(extra="allow")
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
    """Engine graph payload (series / axes) — accept full solver shape."""
    model_config = ConfigDict(extra="allow")
    id: Optional[str] = None
    type: Optional[str] = None
    title: Optional[str] = None
    xAxis: Optional[Dict[str, Any]] = None
    yAxis: Optional[Dict[str, Any]] = None
    series: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None
    # legacy / unused
    nodes: Optional[List[Dict[str, Any]]] = None
    edges: Optional[List[Dict[str, Any]]] = None

# === Core simulation schemas ===
class SimulationBase(BaseModel):
    name: str = "Untitled Simulation"
    experiment_id: Optional[str] = None
    circuit_definition: Optional[Dict[str, Any]] = None

class SimulationCreate(SimulationBase):
    pass

class SimulationUpdate(BaseModel):
    name: Optional[str] = None
    experiment_id: Optional[str] = None
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
    status: str  # engine: completed | invalid | failed | ...
    validation: Optional[ValidationResult] = None
    dcResult: Optional[Dict[str, Any]] = None
    measurements: Optional[Measurements] = None
    graphs: Optional[List[GraphData]] = None
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True, extra="allow")