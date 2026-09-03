from typing import Optional, Dict, Any
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
    
    def load(self, experiment_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Load experiment context for AI.
        
        Args:
            experiment_id: ID of the experiment
            user_id: Optional user ID for ownership verification
            
        Returns:
            Dict with experiment context, or None if not found
            
        Raises:
            HTTPException: If experiment not found
        """
        experiment = get_experiment_by_id(self.db, experiment_id)
        
        if not experiment:
            raise HTTPException(status_code=404, detail="Experiment not found")
        
        # Convert to AI-readable context
        context = {
            "title": experiment.title,
            "difficulty": experiment.difficulty,
            "category": experiment.category,
            "objective": experiment.objective,
            "theory": experiment.theory,
            "short_description": experiment.short_description,
            "duration_minutes": experiment.duration_minutes,
        }
        
        # Only include if present
        if experiment.description:
            context["description"] = experiment.description
        
        return context