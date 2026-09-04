from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from app.models.progress import Progress
from app.models.experiment import Experiment


class UserContext:
    """
    Loads user learning information and converts to AI-readable context.

    This adapter provides learning-related user data for personalization.
    It does NOT include authentication secrets like passwords or tokens.
    Fresh users receive an empty activity profile — never fabricated history.
    """

    def __init__(self, db: Session):
        self.db = db

    def _empty(self) -> Dict[str, Any]:
        return {
            "has_activity": False,
            "completed_experiments": 0,
            "completed_experiments_list": [],
            "recent_learning": [],
            "total_progress_records": 0,
        }

    def load(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Load user learning context for AI.

        Only the authenticated user's own progress is included.
        """
        if not user_id:
            return self._empty()

        progress_records = (
            self.db.query(Progress)
            .filter(
                Progress.user_id == user_id,
                Progress.experiment_id.isnot(None),
            )
            .order_by(Progress.updated_at.desc(), Progress.id.desc())
            .all()
        )

        if not progress_records:
            return self._empty()

        completed = [p for p in progress_records if p.status == "completed"]

        completed_experiments = []
        for p in completed[:5]:
            exp = (
                self.db.query(Experiment)
                .filter(Experiment.id == p.experiment_id)
                .first()
            )
            if exp:
                completed_experiments.append(
                    {
                        "id": exp.id,
                        "title": exp.title,
                        "difficulty": exp.difficulty,
                        "category": exp.category,
                    }
                )

        return {
            "has_activity": True,
            "completed_experiments": len(completed),
            "completed_experiments_list": completed_experiments,
            "total_progress_records": len(progress_records),
            "recent_learning": [
                {
                    "experiment_id": p.experiment_id,
                    "status": p.status,
                }
                for p in progress_records[:5]
            ],
        }

    def load_with_preferences(
        self,
        user_id: str,
        preferred_difficulty: Optional[str] = None,
        current_experiment_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        context = self.load(user_id) or self._empty()

        if preferred_difficulty:
            context["preferred_difficulty"] = preferred_difficulty

        if current_experiment_id:
            context["current_experiment_id"] = current_experiment_id
            exp = (
                self.db.query(Experiment)
                .filter(Experiment.id == current_experiment_id)
                .first()
            )
            if exp:
                context["current_experiment"] = {
                    "id": exp.id,
                    "title": exp.title,
                    "difficulty": exp.difficulty,
                    "category": exp.category,
                }

        return context
