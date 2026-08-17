from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.report import ReportCreate, ReportResponse
from app.services.report_service import create_report, get_report, get_reports

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("", response_model=list[ReportResponse])
def list_reports(db: Session = Depends(get_db)):
    return get_reports(db)


@router.post("", response_model=ReportResponse, status_code=201)
def create_report_endpoint(
    payload: ReportCreate,
    db: Session = Depends(get_db),
):
    return create_report(db, payload)


@router.get("/{report_id}", response_model=ReportResponse)
def get_report_endpoint(
    report_id: int,
    db: Session = Depends(get_db),
):
    return get_report(db, report_id)
