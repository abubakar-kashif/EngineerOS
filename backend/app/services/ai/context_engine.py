import logging
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from app.services.ai.context.experiment_context import ExperimentContext
from app.services.ai.context.quiz_context import QuizContext
from app.services.ai.context.report_context import ReportContext
from app.services.ai.context.user_context import UserContext
from app.services.ai.context.conversation_context import ConversationContext
from app.services.ai.context.simulation_context import SimulationContext

logger = logging.getLogger(__name__)


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
        self.stage: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for prompt building."""
        result: Dict[str, Any] = {}
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
        if self.stage:
            result["stage"] = self.stage
        return result

    def is_empty(self) -> bool:
        """Check if any context was gathered."""
        return not any(
            [
                self.experiment,
                self.simulation,
                self.quiz,
                self.report,
                self.user,
                self.conversation,
                self.current_message,
            ]
        )


class ContextEngine:
    """
    Context Engine orchestrates what information the AI needs.

    It determines which context sources are relevant for a given question
    and coordinates loading that context. Missing sources stay empty —
    nothing is fabricated for fresh users.
    """

    def __init__(self, db: Session):
        self.db = db
        self._experiment_context = ExperimentContext(db)
        self._quiz_context = QuizContext(db)
        self._report_context = ReportContext(db)
        self._user_context = UserContext(db)
        self._conversation_context = ConversationContext(db)
        self._simulation_context = SimulationContext(db)

    def gather_context(
        self,
        user_id: Optional[str],
        conversation_id: str,
        question: str,
        experiment_id: Optional[str] = None,
        simulation_id: Optional[str] = None,
        quiz_id: Optional[str] = None,
        report_id: Optional[str] = None,
        stage: Optional[str] = None,
    ) -> ContextResult:
        """Gather relevant context for a question."""
        result = ContextResult()
        result.current_message = question
        result.stage = stage

        # Experiment catalog (public) + optional stage for learning-flow guidance
        if experiment_id:
            try:
                experiment_data = self._experiment_context.load(
                    experiment_id, user_id, stage=stage
                )
                if experiment_data:
                    result.experiment = experiment_data
            except Exception as e:
                logger.error(f"Failed to load experiment context: {e}")

        # Quiz: only when explicitly requested or experiment-scoped catalog
        if quiz_id and experiment_id:
            try:
                # quiz_id may be a question id string
                qid: Optional[int] = None
                try:
                    qid = int(quiz_id)
                except (TypeError, ValueError):
                    qid = None
                quiz_data = self._quiz_context.load(experiment_id, question_id=qid)
                if quiz_data:
                    result.quiz = quiz_data
            except Exception as e:
                logger.error(f"Failed to load quiz context: {e}")
        elif experiment_id:
            try:
                quiz_data = self._quiz_context.load(experiment_id)
                if quiz_data:
                    # Catalog only — no fabricated student scores
                    result.quiz = {
                        "experiment_id": quiz_data.get("experiment_id"),
                        "total_questions": quiz_data.get("total_questions"),
                        "questions": quiz_data.get("questions"),
                    }
            except Exception as e:
                logger.error(f"Failed to load quiz context: {e}")

        # Reports: ownership required — never attach other users' reports
        if report_id:
            try:
                report_data = self._report_context.load(report_id, user_id)
                if report_data:
                    result.report = report_data
            except Exception as e:
                logger.error(f"Failed to load report context: {e}")
        elif experiment_id and user_id:
            try:
                report_data = self._report_context.load_for_experiment(
                    experiment_id, user_id
                )
                if report_data:
                    result.report = report_data
            except Exception as e:
                logger.error(f"Failed to load report context: {e}")

        # User learning profile — empty for fresh users
        if user_id:
            try:
                user_data = self._user_context.load(user_id)
                if user_data:
                    if experiment_id:
                        user_data = self._user_context.load_with_preferences(
                            user_id,
                            current_experiment_id=experiment_id,
                        )
                    result.user = user_data
            except Exception as e:
                logger.error(f"Failed to load user context: {e}")

        # Conversation history — owned messages only
        if conversation_id:
            try:
                conv_data = self._conversation_context.load_with_current_question(
                    conversation_id,
                    question,
                    user_id,
                    limit=20,
                )
                if conv_data:
                    result.conversation = conv_data.get("recent_messages", [])
            except Exception as e:
                logger.error(f"Failed to load conversation context: {e}")

        # Simulation: ownership required; each run is identifiable for freshness
        if simulation_id:
            if not user_id:
                logger.warning(
                    "Ignoring simulation_id without authenticated user_id (ownership required)"
                )
            else:
                try:
                    sim_data = self._simulation_context.load(simulation_id, user_id)
                    if sim_data:
                        result.simulation = sim_data
                except Exception as e:
                    logger.error(f"Failed to load simulation context: {e}")

        return result
