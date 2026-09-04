"""
Simulation Context Adapter — Converts SimulationResult to AI-readable context.

This adapter transforms authoritative simulation data from the frozen contract
into compact, AI-readable context for the MentorService.

Key rules:
- NEVER fabricate missing measurements
- NEVER calculate missing simulation values
- NEVER modify authoritative simulation data
- Preserve grounding: simulation data is authoritative
- Only the owning user's simulation runs are readable
"""

from __future__ import annotations

import logging
from typing import Optional, Dict, Any, List, Union

from sqlalchemy.orm import Session

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

logger = logging.getLogger(__name__)


def _pick(data: Dict[str, Any], *keys: str, default=None):
    """Return the first present key (supports camelCase and snake_case)."""
    for key in keys:
        if key in data and data[key] is not None:
            return data[key]
    return default


def _as_dict_map(value: Any) -> Dict[str, Any]:
    """Normalize Map-like / object payloads to a plain dict. Never invent entries."""
    if value is None:
        return {}
    if isinstance(value, dict):
        return value
    return {}


def _parse_error(raw: Dict[str, Any]) -> Optional[SimulationError]:
    code_raw = _pick(raw, "code")
    message = _pick(raw, "message")
    if not code_raw or not message:
        return None
    try:
        code = ErrorCode(str(code_raw))
    except ValueError:
        # Preserve unknown codes as OPEN_CIRCUIT-equivalent message without inventing physics.
        # Keep the raw code string in the message path via a best-effort enum fallback.
        code = ErrorCode.SOLVER_FAILED
        message = f"[{code_raw}] {message}"
    return SimulationError(
        code=code,
        severity=str(_pick(raw, "severity", default="error")),
        message=str(message),
        explanation=_pick(raw, "explanation"),
        affected_components=_pick(raw, "affectedComponents", "affected_components"),
        affected_terminals=_pick(raw, "affectedTerminals", "affected_terminals"),
        suggested_fix=_pick(raw, "suggestedFix", "suggested_fix"),
    )


def _parse_component_result(comp_id: str, raw: Dict[str, Any]) -> Optional[ComponentResult]:
    voltage = _pick(raw, "voltage")
    current = _pick(raw, "current")
    power = _pick(raw, "power")
    if voltage is None or current is None or power is None:
        return None
    return ComponentResult(
        component_id=str(_pick(raw, "componentId", "component_id", default=comp_id)),
        voltage=float(voltage),
        current=float(current),
        power=float(power),
        resistance=_pick(raw, "resistance"),
    )


def parse_simulation_result_dict(data: Dict[str, Any]) -> Optional[SimulationResult]:
    """
    Parse a persisted SimulationResult dict (camelCase or snake_case).

    Returns None when the payload cannot be interpreted without inventing fields.
    Does not calculate missing electrical values.
    """
    if not isinstance(data, dict):
        return None

    status_raw = _pick(data, "status")
    if not status_raw:
        return None
    try:
        status = SimulationStatus(str(status_raw))
    except ValueError:
        return None

    validation = None
    validation_raw = _pick(data, "validation")
    if isinstance(validation_raw, dict):
        errors = []
        warnings = []
        for item in validation_raw.get("errors") or []:
            if isinstance(item, dict):
                parsed = _parse_error(item)
                if parsed:
                    errors.append(parsed)
        for item in validation_raw.get("warnings") or []:
            if isinstance(item, dict):
                parsed = _parse_error(item)
                if parsed:
                    warnings.append(parsed)
        valid = validation_raw.get("valid")
        if valid is None:
            valid = len(errors) == 0
        validation = ValidationResult(valid=bool(valid), errors=errors, warnings=warnings)

    dc_result = None
    dc_raw = _pick(data, "dcResult", "dc_result")
    if isinstance(dc_raw, dict):
        component_results: Dict[str, ComponentResult] = {}
        raw_components = _as_dict_map(_pick(dc_raw, "componentResults", "component_results"))
        # Engine may serialize Map as object; also accept list form.
        if isinstance(raw_components, dict):
            for cid, crow in raw_components.items():
                if isinstance(crow, dict):
                    parsed = _parse_component_result(str(cid), crow)
                    if parsed:
                        component_results[parsed.component_id] = parsed
        success = _pick(dc_raw, "success")
        dc_result = DCResult(
            node_voltages={
                str(k): float(v)
                for k, v in _as_dict_map(_pick(dc_raw, "nodeVoltages", "node_voltages")).items()
                if isinstance(v, (int, float))
            },
            branch_currents={
                str(k): float(v)
                for k, v in _as_dict_map(_pick(dc_raw, "branchCurrents", "branch_currents")).items()
                if isinstance(v, (int, float))
            },
            component_results=component_results,
            total_current=float(_pick(dc_raw, "totalCurrent", "total_current", default=0.0) or 0.0),
            total_power=float(_pick(dc_raw, "totalPower", "total_power", default=0.0) or 0.0),
            equivalent_resistance=float(
                _pick(dc_raw, "equivalentResistance", "equivalent_resistance", default=0.0) or 0.0
            ),
            success=bool(success) if success is not None else bool(component_results),
            error=_pick(dc_raw, "error"),
        )

    measurements = None
    meas_raw = _pick(data, "measurements")
    if isinstance(meas_raw, dict):
        component_measurements: List[ComponentMeasurement] = []
        for item in meas_raw.get("componentMeasurements") or meas_raw.get("component_measurements") or []:
            if not isinstance(item, dict):
                continue
            cid = _pick(item, "componentId", "component_id")
            ctype = _pick(item, "type")
            voltage = _pick(item, "voltage")
            current = _pick(item, "current")
            power = _pick(item, "power")
            if cid is None or ctype is None or voltage is None or current is None or power is None:
                continue
            component_measurements.append(
                ComponentMeasurement(
                    component_id=str(cid),
                    type=str(ctype),
                    voltage=float(voltage),
                    current=float(current),
                    power=float(power),
                    resistance=_pick(item, "resistance"),
                )
            )
        measurements = Measurements(
            total_voltage=float(_pick(meas_raw, "totalVoltage", "total_voltage", default=0.0) or 0.0),
            total_current=float(_pick(meas_raw, "totalCurrent", "total_current", default=0.0) or 0.0),
            total_power=float(_pick(meas_raw, "totalPower", "total_power", default=0.0) or 0.0),
            equivalent_resistance=float(
                _pick(meas_raw, "equivalentResistance", "equivalent_resistance", default=0.0) or 0.0
            ),
            component_measurements=component_measurements,
        )

    graphs: Optional[List[GraphData]] = None
    graphs_raw = _pick(data, "graphs")
    if isinstance(graphs_raw, list):
        graphs = []
        for g in graphs_raw:
            if not isinstance(g, dict):
                continue
            gid = _pick(g, "id")
            gtype = _pick(g, "type")
            title = _pick(g, "title")
            if not gid or not gtype or not title:
                continue
            series_list: List[GraphSeries] = []
            for s in g.get("series") or []:
                if not isinstance(s, dict):
                    continue
                name = _pick(s, "name")
                points_raw = s.get("points") or []
                if not name:
                    continue
                points = []
                for p in points_raw:
                    if isinstance(p, dict) and "x" in p and "y" in p:
                        try:
                            points.append(GraphPoint(x=float(p["x"]), y=float(p["y"])))
                        except (TypeError, ValueError):
                            continue
                series_list.append(
                    GraphSeries(name=str(name), points=points, color=_pick(s, "color"))
                )
            x_axis = _pick(g, "x_axis", "xAxis", default={"label": "", "unit": ""}) or {
                "label": "",
                "unit": "",
            }
            y_axis = _pick(g, "y_axis", "yAxis", default={"label": "", "unit": ""}) or {
                "label": "",
                "unit": "",
            }
            if not isinstance(x_axis, dict):
                x_axis = {"label": "", "unit": ""}
            if not isinstance(y_axis, dict):
                y_axis = {"label": "", "unit": ""}
            graphs.append(
                GraphData(
                    id=str(gid),
                    type=str(gtype),
                    title=str(title),
                    x_axis={
                        "label": str(x_axis.get("label", "")),
                        "unit": str(x_axis.get("unit", "")),
                    },
                    y_axis={
                        "label": str(y_axis.get("label", "")),
                        "unit": str(y_axis.get("unit", "")),
                    },
                    series=series_list,
                    metadata=_pick(g, "metadata"),
                )
            )

    return SimulationResult(
        status=status,
        validation=validation,
        dc_result=dc_result,
        measurements=measurements,
        graphs=graphs,
        error=_pick(data, "error"),
        metadata=_pick(data, "metadata") if isinstance(_pick(data, "metadata"), dict) else None,
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

        Ownership: user_id is required. Client-supplied simulation IDs cannot
        bypass ownership — runs belonging to other users are invisible.
        """
        if not user_id:
            return None

        from app.models.simulation import SimulationRun, Simulation

        # Prefer SimulationRun (Person 02 persistence), then legacy Simulation.
        query = self.db.query(SimulationRun).filter(
            SimulationRun.id == simulation_id,
            SimulationRun.user_id == user_id,
        )
        sim_run = query.first()

        result_data = None
        run_meta: Dict[str, Any] = {
            "simulation_run_id": simulation_id,
            "owned_by_requester": True,
        }

        if sim_run:
            result_data = sim_run.results
            run_meta.update(
                {
                    "experiment_id": sim_run.experiment_id,
                    "run_status": sim_run.status,
                    "created_at": sim_run.created_at.isoformat() if sim_run.created_at else None,
                    "updated_at": sim_run.updated_at.isoformat() if sim_run.updated_at else None,
                    "source": "simulation_run",
                }
            )
            # Prefer structured measurements column only as supplemental labels —
            # never invent values when results exist.
            if not result_data and sim_run.validation_errors:
                result_data = {
                    "status": "invalid",
                    "validation": {
                        "valid": False,
                        "errors": sim_run.validation_errors
                        if isinstance(sim_run.validation_errors, list)
                        else [],
                        "warnings": [],
                    },
                }
        else:
            legacy = (
                self.db.query(Simulation)
                .filter(Simulation.id == simulation_id, Simulation.user_id == user_id)
                .first()
            )
            if not legacy:
                return None
            result_data = legacy.results
            run_meta.update(
                {
                    "experiment_id": legacy.experiment_id,
                    "run_status": legacy.status.value
                    if hasattr(legacy.status, "value")
                    else str(legacy.status),
                    "created_at": legacy.created_at.isoformat() if legacy.created_at else None,
                    "updated_at": legacy.updated_at.isoformat() if legacy.updated_at else None,
                    "completed_at": legacy.completed_at.isoformat()
                    if legacy.completed_at
                    else None,
                    "source": "simulation",
                }
            )
            if not result_data and legacy.validation_errors:
                result_data = {
                    "status": "invalid",
                    "validation": {
                        "valid": False,
                        "errors": legacy.validation_errors
                        if isinstance(legacy.validation_errors, list)
                        else [],
                        "warnings": [],
                    },
                }

        if not result_data or not isinstance(result_data, dict):
            return None

        sim_result = parse_simulation_result_dict(result_data)
        if sim_result is None:
            logger.error(
                "Invalid simulation result payload for run %s (user %s)",
                simulation_id,
                user_id,
            )
            return None

        context = self.to_context(sim_result)
        # Freshness / identity: every run is identifiable so Mentor cannot
        # treat an older run as the current one without an explicit ID change.
        context["simulation_run_id"] = simulation_id
        context["run_identity"] = run_meta
        context["authority"] = (
            "These values come from the EngineerOS simulator. "
            "They are authoritative. Do not recalculate or invent replacements."
        )
        return context

    def to_context(self, result: Union[SimulationResult, Dict[str, Any]]) -> Dict[str, Any]:
        """
        Convert SimulationResult to AI-readable context.
        """
        if isinstance(result, dict):
            parsed = parse_simulation_result_dict(result)
            if parsed is None:
                return {}
            result = parsed

        context: Dict[str, Any] = {
            "status": result.status.value
            if isinstance(result.status, SimulationStatus)
            else result.status,
        }

        if result.validation:
            context["validation"] = self._validation_to_context(result.validation)

        if result.dc_result:
            context["dc_result"] = self._dc_result_to_context(result.dc_result)

        if result.measurements:
            context["measurements"] = self._measurements_to_context(result.measurements)

        if result.graphs:
            context["graphs"] = self._graphs_to_context(result.graphs)

        if result.error:
            context["error"] = result.error

        if result.metadata:
            context["metadata"] = result.metadata

        return context

    def _validation_to_context(self, validation: ValidationResult) -> Dict[str, Any]:
        context: Dict[str, Any] = {"valid": validation.valid}

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
        context: Dict[str, Any] = {
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
        context: Dict[str, Any] = {
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
            series_summaries = []
            for series in graph.series:
                series_summaries.append(
                    {
                        "name": series.name,
                        "point_count": len(series.points),
                        "x_range": self._get_point_range(series.points, "x"),
                        "y_range": self._get_point_range(series.points, "y"),
                    }
                )
            summary["series"] = series_summaries
            result.append(summary)
        return result

    def _get_point_range(
        self, points: List[GraphPoint], axis: str
    ) -> Optional[Dict[str, float]]:
        if not points:
            return None
        values = [getattr(p, axis) for p in points]
        return {"min": min(values), "max": max(values)}

    def is_simulation_successful(self, result: SimulationResult) -> bool:
        return result.status == SimulationStatus.COMPLETED

    def has_validation_errors(self, result: SimulationResult) -> bool:
        if not result.validation:
            return False
        return len(result.validation.errors) > 0

    def get_error_summary(self, result: SimulationResult) -> Optional[str]:
        if result.error:
            return result.error
        if result.validation and result.validation.errors:
            return result.validation.errors[0].message
        if result.dc_result and result.dc_result.error:
            return result.dc_result.error
        return None
