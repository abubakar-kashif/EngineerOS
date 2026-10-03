from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.experiment import Experiment
from app.services.experiment_service import get_experiment_by_id


class ExperimentContext:
    """
    Loads authoritative experiment data and converts to AI-readable context.
    """

    def __init__(self, db: Session):
        self.db = db

    def load(
        self,
        experiment_id: str,
        user_id: Optional[str] = None,
        stage: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Load experiment context for AI.

        Includes catalog guidance fields (components, procedure) so Mentor can
        teach how to build the experiment. This is instructional guidance only —
        it does not validate the student's actual circuit.
        """
        experiment = get_experiment_by_id(self.db, experiment_id)

        if not experiment:
            raise HTTPException(status_code=404, detail="Experiment not found")

        context: Dict[str, Any] = {
            "id": experiment.id,
            "title": experiment.title,
            "difficulty": experiment.difficulty,
            "category": experiment.category,
            "objective": experiment.objective,
            "theory": experiment.theory,
            "short_description": experiment.short_description,
            "duration_minutes": experiment.duration_minutes,
        }

        if stage:
            context["current_stage"] = stage

        if experiment.description:
            context["description"] = experiment.description

        # Authoritative catalog guidance — never invent components.
        if experiment.components:
            context["components"] = experiment.components
        if experiment.procedure:
            context["procedure"] = experiment.procedure
        if experiment.formulas:
            context["formulas"] = experiment.formulas
        if experiment.observation_guidance:
            context["observation_guidance"] = experiment.observation_guidance
        if experiment.common_mistakes:
            context["common_mistakes"] = experiment.common_mistakes
        if experiment.simulation_configuration:
            context["simulation_configuration"] = experiment.simulation_configuration
            wheatstone = _wheatstone_theoretical(experiment.simulation_configuration)
            if wheatstone:
                context["theoretical_bridge"] = wheatstone
            pot = _potentiometer_theoretical(experiment.simulation_configuration)
            if pot:
                context["theoretical_potentiometer"] = pot

        context["guidance_boundary"] = (
            "Experiment catalog data is for instructional guidance only. "
            "The simulator — not the Mentor — validates the student's circuit "
            "and determines electrical behavior. "
            "Never invent Vleft, Vright, Vout, wiper position, or other "
            "measurements — use simulation context when a run is attached."
        )

        return context


def _potentiometer_theoretical(config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not isinstance(config, dict) or config.get("mode") != "potentiometer":
        return None
    params = config.get("parameters")
    if not isinstance(params, dict):
        return None
    try:
        vin = float(params["voltage"])
        rpot = float(params.get("rpot") or params["resistance"])
        alpha = float(params.get("wiper_position") or params.get("wiperPosition"))
    except (KeyError, TypeError, ValueError):
        return None
    if vin <= 0 or rpot <= 0 or alpha < 0 or alpha > 1:
        return None
    return {
        "Vin": vin,
        "Rpot": rpot,
        "wiper_position": alpha,
        "Vout": alpha * vin,
        "theoretical_Vout": alpha * vin,
        "relation": "Vout = α · Vin (unloaded)",
        "note": "Theoretical catalog values for the published starter configuration.",
    }


def _wheatstone_theoretical(config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Catalog theoretical values for Wheatstone (not student measurements)."""
    if not isinstance(config, dict):
        return None
    if config.get("mode") != "wheatstone":
        return None
    params = config.get("parameters")
    if not isinstance(params, dict):
        return None
    try:
        vin = float(params["voltage"])
        r1 = float(params["r1"])
        r2 = float(params["r2"])
        r3 = float(params["r3"])
        r4 = float(params["r4"])
    except (KeyError, TypeError, ValueError):
        return None
    if min(vin, r1, r2, r3, r4) <= 0:
        return None
    vleft = vin * r2 / (r1 + r2)
    vright = vin * r4 / (r3 + r4)
    return {
        "Vin": vin,
        "R1": r1,
        "R2": r2,
        "R3": r3,
        "R4": r4,
        "Vleft": vleft,
        "Vright": vright,
        "Vout": vleft - vright,
        "balance_condition": "R1/R2 = R3/R4",
        "balanced": abs(r1 / r2 - r3 / r4) < 1e-9,
        "note": "Theoretical catalog values for the published starter configuration.",
    }
