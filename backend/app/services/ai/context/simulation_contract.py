"""
Simulation Context Contract — AI-side representation.

This module maps the frozen Simulation Result Contract (v1.0.0) into Python types.
The authoritative source is: docs/SIMULATION_RESULT_CONTRACT.md

DO NOT invent fields. DO NOT guess types.
All fields must match the frozen Simulation contract exactly.
"""

from typing import Optional, Dict, List, Any
from enum import Enum
from dataclasses import dataclass, field


class SimulationStatus(str, Enum):
    """Authoritative simulation status from the frozen contract."""
    IDLE = "idle"
    READY = "ready"
    RUNNING = "running"
    COMPLETED = "completed"
    INVALID = "invalid"
    FAILED = "failed"


class ErrorCode(str, Enum):
    """Authoritative error codes from the frozen contract."""
    MISSING_GROUND = "MISSING_GROUND"
    OPEN_CIRCUIT = "OPEN_CIRCUIT"
    FLOATING_NODE = "FLOATING_NODE"
    DANGLING_TERMINAL = "DANGLING_TERMINAL"
    DANGLING_WIRE = "DANGLING_WIRE"
    INVALID_CONNECTION = "INVALID_CONNECTION"
    INVALID_COMPONENT_VALUE = "INVALID_COMPONENT_VALUE"
    SHORT_CIRCUIT = "SHORT_CIRCUIT"
    INVALID_SOURCE_CONFIGURATION = "INVALID_SOURCE_CONFIGURATION"
    LED_NO_CURRENT_LIMIT = "LED_NO_CURRENT_LIMIT"
    DIODE_REVERSE_BIASED = "DIODE_REVERSE_BIASED"
    SOLVER_FAILED = "SOLVER_FAILED"
    UNSUPPORTED_COMPONENT = "UNSUPPORTED_COMPONENT"
    INVALID_COMPONENT_ID = "INVALID_COMPONENT_ID"
    INVALID_TERMINAL_ID = "INVALID_TERMINAL_ID"
    DUPLICATE_CONNECTION = "DUPLICATE_CONNECTION"


@dataclass
class SimulationError:
    """Simulation error/warning from the frozen contract."""
    code: ErrorCode
    severity: str  # 'error' | 'warning' | 'info'
    message: str
    explanation: Optional[str] = None
    affected_components: Optional[List[str]] = None
    affected_terminals: Optional[List[str]] = None
    suggested_fix: Optional[str] = None


@dataclass
class ValidationResult:
    """Validation result from the frozen contract."""
    valid: bool
    errors: List[SimulationError] = field(default_factory=list)
    warnings: List[SimulationError] = field(default_factory=list)


@dataclass
class ComponentResult:
    """Component result from the frozen contract."""
    component_id: str
    voltage: float
    current: float
    power: float
    resistance: Optional[float] = None


@dataclass
class DCResult:
    """DC solver result from the frozen contract."""
    node_voltages: Dict[str, float] = field(default_factory=dict)
    branch_currents: Dict[str, float] = field(default_factory=dict)
    component_results: Dict[str, ComponentResult] = field(default_factory=dict)
    total_current: float = 0.0
    total_power: float = 0.0
    equivalent_resistance: float = 0.0
    success: bool = False
    error: Optional[str] = None


@dataclass
class ComponentMeasurement:
    """Component measurement from the frozen contract."""
    component_id: str
    type: str
    voltage: float
    current: float
    power: float
    resistance: Optional[float] = None


@dataclass
class Measurement:
    """Detailed measurement from the frozen contract."""
    id: str
    type: str  # 'voltage' | 'current' | 'power' | 'resistance' | 'energy'
    value: float
    unit: str
    label: str
    component_id: Optional[str] = None
    terminal_ids: Optional[List[str]] = None
    node_id: Optional[str] = None


@dataclass
class Measurements:
    """Complete measurements from the frozen contract."""
    total_voltage: float = 0.0
    total_current: float = 0.0
    total_power: float = 0.0
    equivalent_resistance: float = 0.0
    component_measurements: List[ComponentMeasurement] = field(default_factory=list)


@dataclass
class GraphPoint:
    """Graph point from the frozen contract."""
    x: float
    y: float


@dataclass
class GraphSeries:
    """Graph series from the frozen contract."""
    name: str
    points: List[GraphPoint]
    color: Optional[str] = None


@dataclass
class GraphData:
    """Graph data from the frozen contract."""
    id: str
    type: str  # 'line' | 'scatter' | 'bar'
    title: str
    x_axis: Dict[str, str]  # {label: str, unit: str}
    y_axis: Dict[str, str]  # {label: str, unit: str}
    series: List[GraphSeries]
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class SimulationResult:
    """
    Complete simulation result from the frozen contract.

    This is the authoritative source for all simulation data consumed by the AI.
    All fields match the frozen Simulation Result Contract v1.0.0.
    """
    status: SimulationStatus
    validation: Optional[ValidationResult] = None
    dc_result: Optional[DCResult] = None
    measurements: Optional[Measurements] = None
    graphs: Optional[List[GraphData]] = None
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None