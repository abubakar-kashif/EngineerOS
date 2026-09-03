from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.report import Report
from app.services.report_service import get_report, get_reports


class ReportContext:
    """
    Loads authoritative report data and converts to AI-readable context.

    This adapter reads report information from the report system.
    It does NOT invent measurements or generate reports.
    """

    def __init__(self, db: Session):
        self.db = db

    def load(self, report_id: int, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Load report context for AI.

        Args:
            report_id: ID of the report
            user_id: Optional user ID for ownership verification

        Returns:
            Dict with report context, or None if not found

        Raises:
            HTTPException: If report not found
        """
        try:
            report = get_report(self.db, report_id)
        except HTTPException:
            raise HTTPException(status_code=404, detail="Report not found")

        if not report:
            return None

        # Convert to AI-readable context
        context = {
            "id": report.id,
            "experiment_id": report.experiment_id,
            "title": report.title,
            "status": report.status,
            "observations": report.observations,
            "conclusion": report.conclusion,
        }

        return context

    def load_for_experiment(
        self,
        experiment_id: str,
        user_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Load reports for an experiment.

        Args:
            experiment_id: ID of the experiment
            user_id: Optional user ID for ownership verification

        Returns:
            Dict with report context, or None if not found
        """
        try:
            reports = get_reports(self.db)
        except Exception:
            return None

        # Filter reports for this experiment
        filtered = [r for r in reports if r.experiment_id == experiment_id]

        if not filtered:
            return None

        # Return the most recent report
        report = filtered[-1]  # Last one (most recent)

        return {
            "id": report.id,
            "experiment_id": report.experiment_id,
            "title": report.title,
            "status": report.status,
            "observations": report.observations,
            "conclusion": report.conclusion,
        }