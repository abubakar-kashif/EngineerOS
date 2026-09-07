from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.user import User
from app.services.report_service import get_report, get_reports


class ReportContext:
    """
    Loads authoritative report data and converts to AI-readable context.

    This adapter reads report information from the report system.
    It does NOT invent measurements or generate reports.
    Ownership is enforced — only the authenticated user's reports are visible.
    """

    def __init__(self, db: Session):
        self.db = db

    def _to_context(self, report) -> Dict[str, Any]:
        return {
            "id": report.id,
            "experiment_id": report.experiment_id,
            "title": report.title,
            "status": report.status,
            "observations": report.observations,
            "conclusion": report.conclusion,
        }

    def load(self, report_id: int, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Load report context for AI with ownership enforcement.
        """
        if not user_id:
            return None

        user = self.db.get(User, user_id)
        if user is None:
            return None

        try:
            report = get_report(self.db, int(report_id), user=user)
        except (HTTPException, TypeError, ValueError):
            return None

        if not report:
            return None

        return self._to_context(report)

    def load_for_experiment(
        self,
        experiment_id: str,
        user_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Load the authenticated user's newest report for an experiment.
        Fresh users with no reports receive None — never fabricated content.
        """
        if not user_id:
            return None

        user = self.db.get(User, user_id)
        if user is None:
            return None

        try:
            reports = get_reports(self.db, user=user)
        except Exception:
            return None

        filtered = [r for r in reports if r.experiment_id == experiment_id]
        if not filtered:
            return None

        # get_reports already returns newest-first for authenticated users
        return self._to_context(filtered[0])
