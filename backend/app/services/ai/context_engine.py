from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from app.services.ai.types import AIMessage


class ContextResult:
    """Result of context gathering for an AI request."""
    
    def __init__(self):
        self.experiment: Optional[Dict[str, Any]] = None
        self.simulation: Optional[Dict[str, Any]] = None
        self.quiz: Optional[Dict[str, Any]] = None
        self.report: Optional[Dict[str, Any]] = None
        self.user: Optional[Dict[str, Any]] = None
        self.conversation: Optional[List[Dict[str, Any]]] = None
        self.current_message: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for prompt building."""
        result = {}
        if self.experiment:
            result["experiment"] = self.experiment
        if self.simulation:
            result["simulation"] = self.simulation
        if self.quiz:
            result["quiz"] = self.quiz
        if self.report:
            result["report"] = self.report
        if self.user:
            result["user"] = self.user
        if self.conversation:
            result["conversation"] = self.conversation
        if self.current_message:
            result["current_message"] = self.current_message
        return result
    
    def is_empty(self) -> bool:
        """Check if any context was gathered."""
        return not any([
            self.experiment,
            self.simulation,
            self.quiz,
            self.report,
            self.user,
            self.conversation,
            self.current_message,
        ])


class ContextEngine:
    """
    Context Engine orchestrates what information the AI needs.
    
    It determines which context sources are relevant for a given question
    and coordinates loading that context.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self._experiment_context = None
        self._simulation_context = None
        self._quiz_context = None
        self._report_context = None
        self._user_context = None
        self._conversation_context = None
    
    def gather_context(
        self,
        user_id: Optional[str],
        conversation_id: str,
        question: str,
        experiment_id: Optional[str] = None,
        simulation_id: Optional[str] = None,
    ) -> ContextResult:
        """
        Gather relevant context for a question.
        
        Args:
            user_id: User ID for ownership
            conversation_id: Current conversation
            question: User's question
            experiment_id: Optional experiment ID
            simulation_id: Optional simulation ID
            
        Returns:
            ContextResult: Structured context
        """
        result = ContextResult()
        result.current_message = question
        
        # Will be implemented when context modules are added
        # For now, placeholder structure
        
        return result
    
    def _get_experiment_context(self, experiment_id: str, user_id: Optional[str]) -> Optional[Dict[str, Any]]:
        """Load experiment context if available."""
        # Phase 11 will implement this
        return None
    
    def _get_simulation_context(self, simulation_id: str, user_id: Optional[str]) -> Optional[Dict[str, Any]]:
        """Load simulation context if available."""
        # Phase 13 will implement this
        return None