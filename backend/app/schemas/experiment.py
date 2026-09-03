from pydantic import BaseModel, ConfigDict
from typing import Dict, List


class FormulaVariable(BaseModel):
    symbol: str
    name: str


class ExperimentFormula(BaseModel):
    expression: str
    variables: List[FormulaVariable] = []


class ExperimentVariable(BaseModel):
    """A quantity used in the experiment's calculations."""

    symbol: str
    name: str
    unit: str | None = None
    description: str | None = None


class ComponentSpec(BaseModel):
    """A piece of equipment or a component required for the experiment."""

    name: str
    quantity: int = 1
    spec: str | None = None


class CircuitDiagram(BaseModel):
    """A text-based circuit sketch plus a short caption."""

    art: str
    caption: str | None = None


class CommonMistake(BaseModel):
    mistake: str
    consequence: str


class SimulationConfiguration(BaseModel):
    """Default parameters for the interactive workspace simulation."""

    mode: str
    parameters: Dict[str, float] = {}


class ExperimentResponse(BaseModel):
    id: str
    title: str
    slug: str
    short_description: str | None = None
    description: str | None = None
    objective: str | None = None
    theory: str | None = None
    difficulty: str
    category: str
    duration_minutes: int
    status: str

    model_config = ConfigDict(from_attributes=True)


class ExperimentDetailResponse(ExperimentResponse):
    """Full experiment payload with the Phase 4 structured content."""

    historical_background: str | None = None
    learning_outcomes: List[str] | None = None
    prerequisites: List[str] | None = None
    formulas: List[ExperimentFormula] | None = None
    variables: List[ExperimentVariable] | None = None
    components: List[ComponentSpec] | None = None
    circuit_diagram: CircuitDiagram | None = None
    procedure: List[str] | None = None
    expected_results: List[str] | None = None
    common_mistakes: List[CommonMistake] | None = None
    safety_precautions: List[str] | None = None
    observation_guidance: List[str] | None = None
    real_world_applications: List[str] | None = None
    related_experiments: List[str] | None = None
    simulation_configuration: SimulationConfiguration | None = None


class ExperimentListResponse(BaseModel):
    items: List[ExperimentResponse]
    total: int
