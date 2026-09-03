from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.progress import Progress
from app.models.experiment import Experiment


class UserContext:
    """
    Loads user learning information and converts to AI-readable context.

    This adapter provides learning-related user data for personalization.
    It does NOT include authentication secrets like passwords or tokens.
    """

    def __init__(self, db: Session):
        self.db = db

    def load(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Load user learning context for AI.

        Args:
            user_id: ID of the user

        Returns:
            Dict with user learning context, or None if not found

        Raises:
            HTTPException: If user not found (handled by caller)
        """
        # Get user's progress
        progress_records = self.db.query(Progress).filter(
            Progress.experiment_id is not None
        ).all()

        if not progress_records:
            # User has no progress yet - return basic info
            return {
                "has_activity": False,
                "completed_experiments": 0,
                "recent_learning": [],
            }

        # Count completed experiments
        completed = [
            p for p in progress_records
            if p.status == "completed"
        ]

        # Get experiment details for completed ones
        completed_experiments = []
        for p in completed[:5]:  # Limit to last 5
            exp = self.db.query(Experiment).filter(
                Experiment.id == p.experiment_id
            ).first()
            if exp:
                completed_experiments.append({
                    "id": exp.id,
                    "title": exp.title,
                    "difficulty": exp.difficulty,
                    "category": exp.category,
                })

        # Build context
        context = {
            "has_activity": True,
            "completed_experiments": len(completed),
            "completed_experiments_list": completed_experiments,
            "total_progress_records": len(progress_records),
            "recent_learning": [
                {
                    "experiment_id": p.experiment_id,
                    "status": p.status,
                }
                for p in progress_records[-5:]  # Last 5
            ],
        }

        return context

    def load_with_preferences(
        self,
        user_id: str,
        preferred_difficulty: Optional[str] = None,
        current_experiment_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Load user context with additional preferences.

        Args:
            user_id: ID of the user
            preferred_difficulty: User's preferred difficulty level
            current_experiment_id: Current experiment ID

        Returns:
            Dict with user learning context
        """
        context = self.load(user_id)

        if not context:
            context = {
                "has_activity": False,
                "completed_experiments": 0,
                "recent_learning": [],
            }

        # Add preferences
        if preferred_difficulty:
            context["preferred_difficulty"] = preferred_difficulty

        if current_experiment_id:
            context["current_experiment_id"] = current_experiment_id
            # Get current experiment details
            exp = self.db.query(Experiment).filter(
                Experiment.id == current_experiment_id
            ).first()
            if exp:
                context["current_experiment"] = {
                    "id": exp.id,
                    "title": exp.title,
                    "difficulty": exp.difficulty,
                    "category": exp.category,
                }

        return context