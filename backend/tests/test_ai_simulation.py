"""
Tests for simulation context (Phases 12-13).
"""

import pytest

from app.services.ai.context.simulation_contract import (
    SimulationResult,
    SimulationStatus,
    ValidationResult,
    SimulationError,
    ErrorCode,
    DCResult,
    ComponentResult,
    Measurements,
    ComponentMeasurement,
    GraphData,
    GraphSeries,
    GraphPoint,
)


class TestSimulationStatus:
    """Tests for SimulationStatus enum."""

    def test_status_values(self):
        assert SimulationStatus.IDLE == "idle"
        assert SimulationStatus.READY == "ready"
        assert SimulationStatus.RUNNING == "running"
        assert SimulationStatus.COMPLETED == "completed"
        assert SimulationStatus.INVALID == "invalid"
        assert SimulationStatus.FAILED == "failed"


class TestErrorCode:
    """Tests for ErrorCode enum."""

    def test_error_code_values(self):
        assert ErrorCode.MISSING_GROUND == "MISSING_GROUND"
        assert ErrorCode.LED_NO_CURRENT_LIMIT == "LED_NO_CURRENT_LIMIT"
        assert ErrorCode.SHORT_CIRCUIT == "SHORT_CIRCUIT"
        assert ErrorCode.SOLVER_FAILED == "SOLVER_FAILED"


class TestSimulationError:
    """Tests for SimulationError dataclass."""

    def test_simulation_error_full(self):
        error = SimulationError(
            code=ErrorCode.LED_NO_CURRENT_LIMIT,
            severity="error",
            message="LED connected without current-limiting resistor",
            explanation="The LED is connected directly to the source",
            affected_components=["LED1"],
            affected_terminals=["LED1.anode", "LED1.cathode"],
            suggested_fix="Add a current-limiting resistor in series",
        )
        assert error.code == ErrorCode.LED_NO_CURRENT_LIMIT
        assert error.severity == "error"
        assert error.affected_components == ["LED1"]
        assert error.suggested_fix is not None

    def test_simulation_error_minimal(self):
        error = SimulationError(
            code=ErrorCode.MISSING_GROUND,
            severity="error",
            message="No ground reference"
        )
        assert error.code == ErrorCode.MISSING_GROUND
        assert error.explanation is None
        assert error.affected_components is None


class TestComponentResult:
    """Tests for ComponentResult dataclass."""

    def test_component_result_full(self):
        comp = ComponentResult(
            component_id="R1",
            voltage=5.0,
            current=0.005,
            power=0.025,
            resistance=1000,
        )
        assert comp.component_id == "R1"
        assert comp.voltage == 5.0
        assert comp.resistance == 1000

    def test_component_result_minimal(self):
        comp = ComponentResult(
            component_id="LED1",
            voltage=2.0,
            current=0.01,
            power=0.02,
        )
        assert comp.component_id == "LED1"
        assert comp.resistance is None


class TestGraphPoint:
    """Tests for GraphPoint dataclass."""

    def test_graph_point(self):
        point = GraphPoint(x=1.0, y=2.0)
        assert point.x == 1.0
        assert point.y == 2.0


class TestSimulationResult:
    """Tests for SimulationResult dataclass."""

    def test_simulation_result_minimal(self):
        result = SimulationResult(status=SimulationStatus.COMPLETED)
        assert result.status == SimulationStatus.COMPLETED
        assert result.validation is None
        assert result.dc_result is None

    def test_simulation_result_full(self):
        result = SimulationResult(
            status=SimulationStatus.COMPLETED,
            validation=ValidationResult(valid=True, errors=[], warnings=[]),
            error=None,
        )
        assert result.status == SimulationStatus.COMPLETED
        assert result.validation is not None
        assert result.validation.valid is True