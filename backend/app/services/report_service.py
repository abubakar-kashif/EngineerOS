from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.experiment import Experiment
from app.models.report import Report
from app.schemas.report import ReportCreate, ReportResponse


def _ensure_experiment_exists(db: Session, experiment_id: str) -> None:
    exists = db.execute(
        select(Experiment.id).where(Experiment.id == experiment_id)
    ).scalar_one_or_none()

    if exists is None:
        raise HTTPException(status_code=404, detail="Experiment not found")


def get_reports(db: Session) -> list[ReportResponse]:
    reports = db.execute(
        select(Report).order_by(Report.id)
    ).scalars().all()

    return [ReportResponse.model_validate(report) for report in reports]


def create_report(db: Session, payload: ReportCreate) -> ReportResponse:
    _ensure_experiment_exists(db, payload.experiment_id)

    report = Report(
        experiment_id=payload.experiment_id,
        title=payload.title,
        observations=payload.observations,
        conclusion=payload.conclusion,
        status="generated",
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return ReportResponse.model_validate(report)


def get_report(db: Session, report_id: int) -> ReportResponse:
    report = db.execute(
        select(Report).where(Report.id == report_id)
    ).scalar_one_or_none()

    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    return ReportResponse.model_validate(report)
