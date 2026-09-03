"""
Simulation Context Adapter — Converts SimulationResult to AI-readable context.

This adapter transforms authoritative simulation data from the frozen contract
into compact, AI-readable context for the MentorService.

Key rules:
- NEVER fabricate missing measurements
- NEVER calculate missing simulation values
- NEVER modify authoritative simulation data
- Preserve grounding: simulation data is authoritative
"""

from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from fastapi import HTTPException

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


class SimulationContext:
    """
    Loads simulation data and converts to AI-readable context.

    This adapter consumes the frozen SimulationResult contract and produces
    compact context for the AI. It never invents or modifies data.
    """

    def __init__(self, db: Session):
        self.db = db

    def load(self, simulation_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Load simulation context for AI from the database.
        """
        from app.models.simulation import SimulationRun

        query = self.db.query(SimulationRun).filter(SimulationRun.id == simulation_id)
        if user_id:
            query = query.filter(SimulationRun.user_id == user_id)
        sim_run = query.first()

        if not sim_run:
            return None

        # The `results` field contains the full SimulationResult (dict)
        result_data = sim_run.results
        if not result_data:
            return None

        # We need to convert this dict into a SimulationResult object using the contract Pydantic model.
        # Import the SimulationResult model from simulation_contract.py
        from app.services.ai.context.simulation_contract import SimulationResult
        # Parse the dict into the model (this validates the structure)
        try:
            sim_result = SimulationResult(**result_data)
        except Exception as e:
            # If the data doesn't match the contract, log and return None
            import logging
            logging.getLogger(__name__).error(f"Invalid simulation result data: {e}")
            return None

        # Now convert to context using the existing `to_context` method
        return self.to_context(sim_result)

    def to_context(self, result: SimulationResult) -> Dict[str, Any]:
        """
        Convert SimulationResult to AI-readable context.

        Args:
            result: Authoritative SimulationResult from the frozen contract

        Returns:
            Dict: Compact AI-readable context
        """
        context = {
            "status": result.status.value if isinstance(result.status, SimulationStatus) else result.status,
        }

        # Validation context
        if result.validation:
            context["validation"] = self._validation_to_context(result.validation)

        # DC result context
        if result.dc_result:
            context["dc_result"] = self._dc_result_to_context(result.dc_result)

        # Measurements context
        if result.measurements:
            context["measurements"] = self._measurements_to_context(result.measurements)

        # Graph context (summaries only)
        if result.graphs:
            context["graphs"] = self._graphs_to_context(result.graphs)

        # Error state
        if result.error:
            context["error"] = result.error

        # Metadata
        if result.metadata:
            context["metadata"] = result.metadata

        return context

    def _validation_to_context(self, validation: ValidationResult) -> Dict[str, Any]:
        """Convert ValidationResult to context."""
        context = {
            "valid": validation.valid,
        }

        if validation.errors:
            context["errors"] = [
                {
                    "code": e.code.value if isinstance(e.code, ErrorCode) else str(e.code),
                    "severity": e.severity,
                    "message": e.message,
                    "explanation": e.explanation,
                    "affected_components": e.affected_components,
                    "suggested_fix": e.suggested_fix,
                }
                for e in validation.errors
            ]

        if validation.warnings:
            context["warnings"] = [
                {
                    "code": w.code.value if isinstance(w.code, ErrorCode) else str(w.code),
                    "severity": w.severity,
                    "message": w.message,
                    "explanation": w.explanation,
                }
                for w in validation.warnings
            ]

        return context

    def _dc_result_to_context(self, dc_result: DCResult) -> Dict[str, Any]:
        """Convert DCResult to context."""
        context = {
            "success": dc_result.success,
            "total_current": dc_result.total_current,
            "total_power": dc_result.total_power,
            "equivalent_resistance": dc_result.equivalent_resistance,
        }

        if dc_result.node_voltages:
            context["node_voltages"] = dc_result.node_voltages

        if dc_result.branch_currents:
            context["branch_currents"] = dc_result.branch_currents

        if dc_result.component_results:
            context["component_results"] = [
                {
                    "component_id": comp.component_id,
                    "voltage": comp.voltage,
                    "current": comp.current,
                    "power": comp.power,
                    "resistance": comp.resistance,
                }
                for comp in dc_result.component_results.values()
            ]

        if dc_result.error:
            context["error"] = dc_result.error

        return context

    def _measurements_to_context(self, measurements: Measurements) -> Dict[str, Any]:
        """Convert Measurements to context."""
        context = {
            "total_voltage": measurements.total_voltage,
            "total_current": measurements.total_current,
            "total_power": measurements.total_power,
            "equivalent_resistance": measurements.equivalent_resistance,
        }

        if measurements.component_measurements:
            context["component_measurements"] = [
                {
                    "component_id": cm.component_id,
                    "type": cm.type,
                    "voltage": cm.voltage,
                    "current": cm.current,
                    "power": cm.power,
                    "resistance": cm.resistance,
                }
                for cm in measurements.component_measurements
            ]

        return context

    def _graphs_to_context(self, graphs: List[GraphData]) -> List[Dict[str, Any]]:
        """
        Convert GraphData list to context summaries.

        Only include summary information, not full point data.
        The frontend renders full graphs; AI explains them.
        """
        result = []
        for graph in graphs:
            summary = {
                "id": graph.id,
                "type": graph.type,
                "title": graph.title,
                "x_label": graph.x_axis.get("label", ""),
                "x_unit": graph.x_axis.get("unit", ""),
                "y_label": graph.y_axis.get("label", ""),
                "y_unit": graph.y_axis.get("unit", ""),
                "series_count": len(graph.series),
            }

            # Add point count per series
            series_summaries = []
            for series in graph.series:
                series_summaries.append({
                    "name": series.name,
                    "point_count": len(series.points),
                    "x_range": self._get_point_range(series.points, "x"),
                    "y_range": self._get_point_range(series.points, "y"),
                })
            summary["series"] = series_summaries

            result.append(summary)

        return result

    def _get_point_range(self, points: List[GraphPoint], axis: str) -> Optional[Dict[str, float]]:
        """Get min/max range for graph points."""
        if not points:
            return None

        values = [getattr(p, axis) for p in points]
        return {
            "min": min(values),
            "max": max(values),
        }

    def is_simulation_successful(self, result: SimulationResult) -> bool:
        """Check if simulation completed successfully."""
        return result.status == SimulationStatus.COMPLETED

    def has_validation_errors(self, result: SimulationResult) -> bool:
        """Check if simulation has validation errors."""
        if not result.validation:
            return False
        return len(result.validation.errors) > 0

    def get_error_summary(self, result: SimulationResult) -> Optional[str]:
        """Get a summary of the simulation error."""
        if result.error:
            return result.error
        if result.validation and result.validation.errors:
            # Return first error message
            return result.validation.errors[0].message
        if result.dc_result and result.dc_result.error:
            return result.dc_result.error
        return None