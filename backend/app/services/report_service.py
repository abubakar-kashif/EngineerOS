"""Lab report generation and retrieval.

A report is a snapshot of a full engineering lab document: content sections
are copied from the experiment, measured values are pulled from the user's
latest simulation run, and quiz performance from their latest quiz attempt.
Anything without a real source stays NULL — missing measurements are never
fabricated.
"""

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.experiment import Experiment
from app.models.quiz import QuizAttempt
from app.models.report import Report
from app.models.simulation import SimulationRun
from app.models.user import User
from app.schemas.report import ReportCreate, ReportResponse
from app.services.notification_service import create_notification

# Solver "global" measurement fields → report row (label, unit).
GLOBAL_MEASUREMENT_FIELDS = (
    ("sourceVoltage", "Source Voltage", "V"),
    ("totalResistance", "Total Resistance", "Ω"),
    ("totalCurrent", "Total Current", "A"),
    ("totalPower", "Total Power", "W"),
)

# Solver per-component result fields → report row (label suffix, unit).
COMPONENT_MEASUREMENT_FIELDS = (
    ("voltage", "Voltage", "V"),
    ("current", "Current", "A"),
    ("power", "Power", "W"),
)


def _ensure_experiment_exists(db: Session, experiment_id: str) -> Experiment:
    experiment = db.execute(
        select(Experiment).where(Experiment.id == experiment_id)
    ).scalar_one_or_none()

    if experiment is None:
        raise HTTPException(status_code=404, detail="Experiment not found")

    return experiment


def _numeric(value) -> float | None:
    """Accept only real numbers (booleans are not measurements)."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    return value


def _latest_simulation_run(
    db: Session, user_id: str, experiment_id: str
) -> SimulationRun | None:
    """Newest simulation run with solver results for this user + experiment."""
    return (
        db.execute(
            select(SimulationRun)
            .where(
                SimulationRun.user_id == user_id,
                SimulationRun.experiment_id == experiment_id,
                SimulationRun.results.is_not(None),
            )
            .order_by(SimulationRun.created_at.desc(), SimulationRun.id.desc())
        )
        .scalars()
        .first()
    )


def _latest_quiz_attempt(
    db: Session, user_id: str, experiment_id: str
) -> QuizAttempt | None:
    return (
        db.execute(
            select(QuizAttempt)
            .where(
                QuizAttempt.user_id == user_id,
                QuizAttempt.experiment_id == experiment_id,
            )
            .order_by(QuizAttempt.created_at.desc(), QuizAttempt.id.desc())
        )
        .scalars()
        .first()
    )


def _component_label_map(circuit: dict) -> dict[str, str]:
    labels: dict[str, str] = {}
    for component in circuit.get("components", []):
        if isinstance(component, dict) and component.get("id"):
            labels[component["id"]] = component.get("label") or component["id"]
    return labels


def _append_component_rows(
    rows: list[dict],
    component_rows: list,
    labels: dict[str, str],
    id_key: str = "componentId",
) -> None:
    for component_result in component_rows:
        if not isinstance(component_result, dict):
            continue
        component_id = component_result.get(id_key) or component_result.get("component_id")
        if not component_id:
            continue
        name = labels.get(component_id, component_id)
        for field, quantity, unit in COMPONENT_MEASUREMENT_FIELDS:
            value = _numeric(component_result.get(field))
            if value is not None:
                rows.append({"label": f"{name} {quantity}", "value": value, "unit": unit})


def _wheatstone_measured_rows(
    results: dict, labels: dict[str, str]
) -> list[dict]:
    """Derive Vleft / Vright / Vout from live SimulationResult measurements."""
    measurements = results.get("measurements")
    if not isinstance(measurements, dict):
        return []

    components = measurements.get("componentMeasurements") or measurements.get(
        "component_measurements"
    )
    if not isinstance(components, list):
        return []

    by_label: dict[str, dict] = {}
    for row in components:
        if not isinstance(row, dict):
            continue
        cid = row.get("componentId") or row.get("component_id")
        if not cid:
            continue
        name = labels.get(cid, cid)
        by_label[name] = row
        by_label[cid] = row

    r2 = by_label.get("R2")
    r4 = by_label.get("R4")
    vm = by_label.get("VM1") or next(
        (
            row
            for row in components
            if isinstance(row, dict) and row.get("type") == "voltmeter"
        ),
        None,
    )

    vleft = _numeric(r2.get("voltage")) if r2 else None
    vright = _numeric(r4.get("voltage")) if r4 else None
    vout = _numeric(vm.get("voltage")) if vm else None
    if vout is None and vleft is not None and vright is not None:
        vout = vleft - vright

    rows: list[dict] = []
    if vleft is not None:
        rows.append({"label": "Vleft", "value": vleft, "unit": "V"})
    if vright is not None:
        rows.append({"label": "Vright", "value": vright, "unit": "V"})
    if vout is not None:
        rows.append({"label": "Vout", "value": vout, "unit": "V"})
    if vleft is not None and vright is not None:
        rows.append(
            {
                "label": "Balance condition",
                "value": 1.0 if abs(vleft - vright) < 1e-6 else 0.0,
                "unit": "balanced",
            }
        )
    return rows


def _measured_rows(run: SimulationRun) -> list[dict] | None:
    """Measurement rows extracted from the run's solver output.

    Returns None when the run carries no numeric results — the report then
    honestly records "no measurements" instead of inventing values.
    Supports both the legacy {global, components} shape and the live
    SimulationResult {measurements, dcResult} contract.
    """
    results = run.results if isinstance(run.results, dict) else None
    if not results:
        return None

    circuit = run.circuit_definition if isinstance(run.circuit_definition, dict) else {}
    labels = _component_label_map(circuit)
    rows: list[dict] = []

    global_data = results.get("global")
    if isinstance(global_data, dict):
        for field, label, unit in GLOBAL_MEASUREMENT_FIELDS:
            value = _numeric(global_data.get(field))
            if value is not None:
                rows.append({"label": label, "value": value, "unit": unit})
        _append_component_rows(rows, results.get("components") or [], labels)

    measurements = results.get("measurements")
    if isinstance(measurements, dict):
        mapping = (
            ("totalVoltage", "Source Voltage", "V"),
            ("equivalentResistance", "Total Resistance", "Ω"),
            ("totalCurrent", "Total Current", "A"),
            ("totalPower", "Total Power", "W"),
        )
        for field, label, unit in mapping:
            value = _numeric(measurements.get(field))
            if value is not None and not any(r["label"] == label for r in rows):
                rows.append({"label": label, "value": value, "unit": unit})

        component_rows = measurements.get("componentMeasurements") or measurements.get(
            "component_measurements"
        )
        if isinstance(component_rows, list):
            _append_component_rows(rows, component_rows, labels)

        for wheatstone_row in _wheatstone_measured_rows(results, labels):
            if not any(r["label"] == wheatstone_row["label"] for r in rows):
                rows.append(wheatstone_row)

    return rows or None


def _wheatstone_reference_rows(parameters: dict, voltage: float) -> list[dict] | None:
    r1 = _numeric(parameters.get("r1"))
    r2 = _numeric(parameters.get("r2"))
    r3 = _numeric(parameters.get("r3"))
    r4 = _numeric(parameters.get("r4"))
    if None in (r1, r2, r3, r4) or min(r1, r2, r3, r4) <= 0:
        return None

    vleft = voltage * r2 / (r1 + r2)
    vright = voltage * r4 / (r3 + r4)
    vout = vleft - vright
    i_left = voltage / (r1 + r2)
    i_right = voltage / (r3 + r4)

    return [
        {"label": "Source Voltage", "value": voltage, "unit": "V"},
        {"label": "R1", "value": r1, "unit": "Ω"},
        {"label": "R2", "value": r2, "unit": "Ω"},
        {"label": "R3", "value": r3, "unit": "Ω"},
        {"label": "R4", "value": r4, "unit": "Ω"},
        {"label": "Vleft", "value": vleft, "unit": "V"},
        {"label": "Vright", "value": vright, "unit": "V"},
        {"label": "Vout", "value": vout, "unit": "V"},
        {
            "label": "Balance condition",
            "value": 1.0 if abs(r1 / r2 - r3 / r4) < 1e-9 else 0.0,
            "unit": "balanced",
        },
        {"label": "Left branch current", "value": i_left, "unit": "A"},
        {"label": "Right branch current", "value": i_right, "unit": "A"},
    ]


def _reference_rows(experiment: Experiment) -> list[dict] | None:
    """Theoretical reference values from the experiment's simulation brief.

    Computed from the reference configuration published with the experiment —
    not from the student's circuit. Returns None when the experiment
    publishes no usable configuration.
    """
    config = (
        experiment.simulation_configuration
        if isinstance(experiment.simulation_configuration, dict)
        else None
    )
    if not config:
        return None
    parameters = config.get("parameters")
    if not isinstance(parameters, dict):
        return None

    voltage = _numeric(parameters.get("voltage"))
    r1 = _numeric(parameters.get("r1"))
    r2 = _numeric(parameters.get("r2"))
    if voltage is None or r1 is None or voltage <= 0 or r1 <= 0:
        return None

    if config.get("mode") == "wheatstone" or experiment.id == "wheatstone-bridge":
        return _wheatstone_reference_rows(parameters, voltage)

    if config.get("mode") == "parallel":
        if r2 is None or r2 <= 0:
            return None
        total_resistance = (r1 * r2) / (r1 + r2)
    else:
        total_resistance = r1 + (r2 or 0.0)

    rows = [
        {"label": "Source Voltage", "value": voltage, "unit": "V"},
        {"label": "Total Resistance", "value": total_resistance, "unit": "Ω"},
    ]
    current = voltage / total_resistance
    rows.append({"label": "Total Current", "value": current, "unit": "A"})
    rows.append({"label": "Total Power", "value": voltage * current, "unit": "W"})
    return rows


def _calculated_rows(measured_rows: list[dict] | None) -> list[dict] | None:
    """Quantities derived from the measured values (R = V / I, P = V × I).

    Only computed when the required measurements exist.
    """
    if not measured_rows:
        return None

    values = {row["label"]: _numeric(row.get("value")) for row in measured_rows}
    voltage = values.get("Source Voltage")
    current = values.get("Total Current")

    rows: list[dict] = []
    if voltage is not None and current is not None and current != 0:
        rows.append(
            {
                "label": "Total Resistance",
                "value": voltage / current,
                "unit": "Ω",
                "formula": "R = V / I",
            }
        )
        rows.append(
            {
                "label": "Total Power",
                "value": voltage * current,
                "unit": "W",
                "formula": "P = V × I",
            }
        )

    return rows or None


def _percentage_error_rows(
    reference_rows: list[dict] | None, measured_rows: list[dict] | None
) -> list[dict] | None:
    """|theoretical − measured| / theoretical × 100 for comparable quantities.

    Rows are produced only where both a reference value and a measured value
    exist — no reference or no measurement means no comparison.
    """
    if not reference_rows or not measured_rows:
        return None

    measured = {
        row["label"]: _numeric(row.get("value")) for row in measured_rows
    }

    rows: list[dict] = []
    for reference in reference_rows:
        theoretical = _numeric(reference.get("value"))
        observed = measured.get(reference["label"])
        if theoretical is None or theoretical == 0 or observed is None:
            continue
        rows.append(
            {
                "label": reference["label"],
                "theoretical": theoretical,
                "measured": observed,
                "unit": reference.get("unit", ""),
                "error_percent": abs(theoretical - observed) / abs(theoretical) * 100,
            }
        )

    return rows or None


def _theoretical_results(
    reference_rows: list[dict] | None, experiment: Experiment
) -> dict | None:
    """Reference values plus the experiment's predicted outcomes."""
    expected = experiment.expected_results or None
    if reference_rows is None and expected is None:
        return None
    return {
        "reference_values": reference_rows,
        "expected_outcomes": list(expected) if expected else None,
    }


def _quiz_performance(attempt: QuizAttempt) -> dict:
    return {
        "score": attempt.score,
        "correct_answers": attempt.correct_answers,
        "total_questions": attempt.total_questions,
        "passed": attempt.passed,
    }


def _experiment_titles(db: Session, experiment_ids: set[str]) -> dict[str, str]:
    if not experiment_ids:
        return {}
    rows = db.execute(
        select(Experiment.id, Experiment.title).where(
            Experiment.id.in_(experiment_ids)
        )
    ).all()
    return {row.id: row.title for row in rows}


def _to_response(report: Report, experiment_title: str) -> ReportResponse:
    response = ReportResponse.model_validate(report)
    response.experiment_title = experiment_title
    return response


def get_reports(db: Session, user: User | None = None) -> list[ReportResponse]:
    """List reports.

    Authenticated users see only their own reports (newest first).
    Anonymous requests keep the legacy behaviour: ownerless rows only.
    """
    query = select(Report)
    if user is not None:
        query = query.where(Report.user_id == user.id)
        query = query.order_by(Report.created_at.desc(), Report.id.desc())
    else:
        query = query.where(Report.user_id.is_(None))
        query = query.order_by(Report.id)

    reports = db.execute(query).scalars().all()
    titles = _experiment_titles(db, {report.experiment_id for report in reports})

    return [
        _to_response(report, titles.get(report.experiment_id, report.experiment_id))
        for report in reports
    ]


def create_report(
    db: Session,
    payload: ReportCreate,
    user: User | None = None,
) -> ReportResponse:
    experiment = _ensure_experiment_exists(db, payload.experiment_id)

    measured_rows = None
    quiz_performance = None
    if user is not None:
        # Simulation runs and quiz attempts are user-owned — only signed-in
        # users can attach measured values and quiz performance.
        run = _latest_simulation_run(db, user.id, experiment.id)
        if run is not None:
            measured_rows = _measured_rows(run)
        attempt = _latest_quiz_attempt(db, user.id, experiment.id)
        if attempt is not None:
            quiz_performance = _quiz_performance(attempt)

    reference_rows = _reference_rows(experiment)

    report = Report(
        user_id=user.id if user is not None else None,
        experiment_id=experiment.id,
        title=payload.title,
        student_name=user.name if user is not None else None,
        objective=experiment.objective,
        theory=experiment.theory,
        historical_background=experiment.historical_background,
        components=list(experiment.components) if experiment.components else None,
        circuit_diagram=dict(experiment.circuit_diagram)
        if experiment.circuit_diagram
        else None,
        procedure=list(experiment.procedure) if experiment.procedure else None,
        theoretical_results=_theoretical_results(reference_rows, experiment),
        measured_results=measured_rows,
        calculated_results=_calculated_rows(measured_rows),
        percentage_error=_percentage_error_rows(reference_rows, measured_rows),
        quiz_performance=quiz_performance,
        observations=payload.observations,
        conclusion=payload.conclusion,
        status="generated",
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    if user is not None:
        preferences = user.preferences
        if preferences is None or preferences.notify_report_completion:
            create_notification(
                db,
                user_id=user.id,
                type="report",
                title="Report generated",
                message=f'Your report "{payload.title}" is ready.',
                meta={
                    "report_id": report.id,
                    "experiment_id": experiment.id,
                },
            )

    return _to_response(report, experiment.title)


def get_report(
    db: Session,
    report_id: int,
    user: User | None = None,
) -> ReportResponse:
    query = select(Report).where(Report.id == report_id)
    if user is not None:
        query = query.where(Report.user_id == user.id)
    else:
        query = query.where(Report.user_id.is_(None))

    report = db.execute(query).scalar_one_or_none()

    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    title = db.execute(
        select(Experiment.title).where(Experiment.id == report.experiment_id)
    ).scalar_one_or_none()

    return _to_response(report, title or report.experiment_id)
