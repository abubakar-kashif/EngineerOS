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
            superposition = _superposition_theoretical(experiment.simulation_configuration)
            if superposition:
                context["theoretical_superposition"] = superposition
            thevenin = _thevenin_theoretical(experiment.simulation_configuration)
            if thevenin:
                context["theoretical_thevenin"] = thevenin
            norton = _norton_theoretical(experiment.simulation_configuration)
            if norton:
                context["theoretical_norton"] = norton
            mpt = _max_power_theoretical(experiment.simulation_configuration)
            if mpt:
                context["theoretical_maximum_power_transfer"] = mpt
            resonance = _series_resonance_theoretical(experiment.simulation_configuration)
            if resonance:
                context["theoretical_series_resonance"] = resonance
            half_wave = _half_wave_rectifier_theoretical(
                experiment.simulation_configuration
            )
            if half_wave:
                context["theoretical_half_wave_rectifier"] = half_wave
            full_wave = _full_wave_bridge_theoretical(
                experiment.simulation_configuration
            )
            if full_wave:
                context["theoretical_full_wave_bridge"] = full_wave
            low_pass = _rc_low_pass_theoretical(experiment.simulation_configuration)
            if low_pass:
                context["theoretical_rc_low_pass"] = low_pass

        context["guidance_boundary"] = (
            "Experiment catalog data is for instructional guidance only. "
            "The simulator — not the Mentor — validates the student's circuit "
            "and determines electrical behavior. "
            "Never invent Vleft, Vright, Vout, wiper position, superposition "
            "contributions, Vth, Rth, IN, RN, sweep peaks, or other "
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


def _thevenin_theoretical(config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not isinstance(config, dict) or config.get("mode") != "thevenin":
        return None
    params = config.get("parameters")
    if not isinstance(params, dict):
        return None
    try:
        vs = float(params["voltage"])
        r1 = float(params["r1"])
        r2 = float(params["r2"])
        rl = float(params["rl"])
    except (KeyError, TypeError, ValueError):
        return None
    if min(vs, r1, r2, rl) <= 0:
        return None
    vth = vs * r2 / (r1 + r2)
    rth = (r1 * r2) / (r1 + r2)
    il = vth / (rth + rl)
    vl = il * rl
    return {
        "original_circuit": {"Vs": vs, "R1": r1, "R2": r2, "RL": rl},
        "equivalent_circuit": {"Vth": vth, "Rth": rth},
        "Vth": vth,
        "Rth": rth,
        "RL": rl,
        "VL": vl,
        "IL": il,
        "relation": "IL = Vth / (Rth + RL)",
        "note": "Theoretical catalog values for the published starter configuration.",
    }


def _max_power_theoretical(config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not isinstance(config, dict) or config.get("mode") != "maximum-power-transfer":
        return None
    params = config.get("parameters")
    if not isinstance(params, dict):
        return None
    try:
        vs = float(params["voltage"])
        r1 = float(params["r1"])
        r2 = float(params["r2"])
        rl = float(params["rl"])
    except (KeyError, TypeError, ValueError):
        return None
    if min(vs, r1, r2, rl) <= 0:
        return None
    vth = vs * r2 / (r1 + r2)
    rth = (r1 * r2) / (r1 + r2)
    il = vth / (rth + rl)
    vl = il * rl
    pl = vl * il
    pmax = (vth * vth) / (4 * rth)
    return {
        "Vth": vth,
        "Rth": rth,
        "RL_operating": rl,
        "VL": vl,
        "IL": il,
        "PL": pl,
        "theoretical_optimum_RL": rth,
        "theoretical_maximum_power": pmax,
        "condition": "RL = Rth for maximum power (resistive DC)",
        "relation": "Pmax = Vth² / (4 Rth); PL = VL · IL",
        "note": (
            "Catalog theory for the starter. Prefer attached simulation sweep "
            "results for the measured maximum point."
        ),
    }


def _series_resonance_theoretical(config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not isinstance(config, dict) or config.get("mode") != "series-resonance":
        return None
    params = config.get("parameters")
    if not isinstance(params, dict):
        return None
    try:
        vin = float(params["voltage"])
        r = float(params["r1"])
        l = float(params["l1"])
        c = float(params["c1"])
    except (KeyError, TypeError, ValueError):
        return None
    if min(vin, r, l, c) <= 0:
        return None
    import math

    f0 = 1.0 / (2.0 * math.pi * math.sqrt(l * c))
    q_theory = (1.0 / r) * math.sqrt(l / c)
    return {
        "Vin": vin,
        "R": r,
        "L": l,
        "C": c,
        "f0": f0,
        "theoretical_f0": f0,
        "relation": "f0 = 1 / (2π√(LC))",
        "theoretical_Q_series": q_theory,
        "note": (
            "Catalog theory for the starter. Simulated f0 must come from the "
            "AC frequency sweep (max |I|). Report Q/BW only when half-power "
            "points are found on that sweep."
        ),
    }


def _half_wave_rectifier_theoretical(config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not isinstance(config, dict) or config.get("mode") != "half-wave-rectifier":
        return None
    params = config.get("parameters")
    if not isinstance(params, dict):
        return None
    try:
        vin = float(params["voltage"])
        freq = float(params["frequency"])
        rl = float(params["rl"])
        vf = float(params.get("vf", 0.7))
    except (KeyError, TypeError, ValueError):
        return None
    if min(vin, freq, rl) <= 0 or vf < 0:
        return None
    import math

    vout_peak_ideal = max(vin - vf, 0.0)
    # Ideal half-sine average uses the load peak; with Vf, ≈ (Vin − Vf)/π.
    vavg_ideal = vout_peak_ideal / math.pi
    return {
        "Vin_peak": vin,
        "frequency": freq,
        "RL": rl,
        "Vf": vf,
        "theoretical_Vout_peak": vout_peak_ideal,
        "theoretical_average_ideal": vavg_ideal,
        "theoretical_ripple_frequency": freq,
        "relation": "Vout ≈ Vin − Vf when conducting; f_ripple = f_line (unfiltered)",
        "note": (
            "Catalog theory for the starter. Prefer attached transient "
            "measurements (VinPeak, VoutPeak, averageOutput, rippleFrequency) "
            "from the real diode solve — do not invent waveforms."
        ),
    }


def _rc_low_pass_theoretical(config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not isinstance(config, dict) or config.get("mode") != "rc-low-pass-filter":
        return None
    params = config.get("parameters")
    if not isinstance(params, dict):
        return None
    try:
        vin = float(params["voltage"])
        frequency = float(params["frequency"])
        resistance = float(params["r"])
        capacitance = float(params["c"])
    except (KeyError, TypeError, ValueError):
        return None
    if min(vin, resistance, capacitance) <= 0 or frequency < 0:
        return None
    import math

    fc = 1.0 / (2.0 * math.pi * resistance * capacitance)
    ratio = frequency / fc if fc > 0 else 0.0
    gain = 1.0 / math.sqrt(1.0 + ratio * ratio)
    phase = -math.degrees(math.atan2(frequency, fc)) if fc > 0 else 0.0
    return {
        "R": resistance,
        "C": capacitance,
        "Vin": vin,
        "drive_frequency": frequency,
        "theoretical_fc": fc,
        "theoretical_gain_at_drive": gain,
        "theoretical_phase_deg_at_drive": phase,
        "relation": "fc = 1/(2πRC); |H| = 1/sqrt(1+(f/fc)^2)",
        "note": (
            "Catalog theory for the starter. Prefer attached sweep measurements "
            "(fcSimulated, gainAtDrive) from the AC solve. Do not invent a Bode plot."
        ),
    }


def _full_wave_bridge_theoretical(config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not isinstance(config, dict) or config.get("mode") != "full-wave-bridge-rectifier":
        return None
    params = config.get("parameters")
    if not isinstance(params, dict):
        return None
    try:
        vin = float(params["voltage"])
        freq = float(params["frequency"])
        rl = float(params["rl"])
        vf = float(params.get("vf", 0.7))
    except (KeyError, TypeError, ValueError):
        return None
    if min(vin, freq, rl) <= 0 or vf < 0:
        return None
    import math

    vout_peak = max(vin - 2.0 * vf, 0.0)
    vavg = 2.0 * vout_peak / math.pi
    return {
        "Vin_peak": vin,
        "frequency": freq,
        "RL": rl,
        "Vf": vf,
        "theoretical_Vout_peak": vout_peak,
        "theoretical_average_ideal": vavg,
        "theoretical_ripple_frequency": 2.0 * freq,
        "relation": "Two diodes conduct each half-cycle; Vout ≈ |Vin| − 2 Vf; f_ripple = 2 f",
        "note": (
            "Catalog theory for the starter. Prefer attached transient "
            "measurements from the four-diode solve. Do not invent a rectified sine."
        ),
    }


def _norton_theoretical(config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not isinstance(config, dict) or config.get("mode") != "norton":
        return None
    params = config.get("parameters")
    if not isinstance(params, dict):
        return None
    try:
        vs = float(params["voltage"])
        r1 = float(params["r1"])
        r2 = float(params["r2"])
        rl = float(params["rl"])
    except (KeyError, TypeError, ValueError):
        return None
    if min(vs, r1, r2, rl) <= 0:
        return None
    vth = vs * r2 / (r1 + r2)
    rn = (r1 * r2) / (r1 + r2)
    inorton = vth / rn
    il = inorton * rn / (rn + rl)
    vl = il * rl
    return {
        "original_circuit": {"Vs": vs, "R1": r1, "R2": r2, "RL": rl, "IL": il, "VL": vl},
        "equivalent_circuit": {"IN": inorton, "RN": rn},
        "IN": inorton,
        "RN": rn,
        "RL": rl,
        "IL": il,
        "original_IL": il,
        "equivalent_IL": il,
        "relation": "IL = IN · RN / (RN + RL)",
        "note": "Theoretical catalog values for the published starter configuration.",
    }


def _superposition_theoretical(config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not isinstance(config, dict) or config.get("mode") != "superposition":
        return None
    params = config.get("parameters")
    if not isinstance(params, dict):
        return None
    try:
        v1 = float(params["v1"])
        v2 = float(params["v2"])
        r1 = float(params["r1"])
        r2 = float(params["r2"])
        rl = float(params["rl"])
    except (KeyError, TypeError, ValueError):
        return None
    if min(r1, r2, rl) <= 0:
        return None
    g = 1 / r1 + 1 / r2 + 1 / rl
    v_full = (v1 / r1 + v2 / r2) / g
    v1_only = (v1 / r1) / g
    v2_only = (v2 / r2) / g
    return {
        "V1": v1,
        "V2": v2,
        "R1": r1,
        "R2": r2,
        "RL": rl,
        "full_circuit_Vout": v_full,
        "V1_contribution": v1_only,
        "V2_contribution": v2_only,
        "sum_of_contributions": v1_only + v2_only,
        "deactivation": {
            "voltage_source": "short circuit (0 V)",
            "current_source": "open circuit (0 A)",
        },
        "relation": "X_total = X1 + X2 (linear quantities only)",
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
