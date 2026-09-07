from typing import Optional, Dict, Any, List
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.quiz import QuizQuestion


class QuizContext:
    """
    Loads authoritative quiz data and converts to AI-readable context.

    This adapter reads quiz information from the quiz system ORM models —
    not the student-facing QuizQuestionResponse schema (which intentionally
    omits correct_answer / explanation).

    It does NOT modify scores, correctness, or attempt states.
    It does NOT invent answers or grade quizzes.
    """

    def __init__(self, db: Session):
        self.db = db

    def _fetch_questions(self, experiment_id: str) -> List[QuizQuestion]:
        return list(
            self.db.execute(
                select(QuizQuestion)
                .where(QuizQuestion.experiment_id == experiment_id)
                .order_by(QuizQuestion.id)
            )
            .scalars()
            .all()
        )

    def _question_to_ai_data(
        self,
        q: QuizQuestion,
        *,
        include_explanation: bool = False,
    ) -> Dict[str, Any]:
        """
        Convert an ORM question for Mentor context.

        correct_answer is never included here — grading remains the quiz system's job.
        Explanations are only attached after an official result (load_with_result),
        so the Mentor cannot leak answer keys during an active attempt.
        """
        q_data: Dict[str, Any] = {
            "id": q.id,
            "question": q.question,
            "options": [
                q.option_a,
                q.option_b,
                q.option_c,
                q.option_d,
            ],
        }

        if include_explanation:
            # Prefer ORM attribute; tolerate legacy / response-shaped objects safely.
            explanation = getattr(q, "explanation", None)
            if explanation:
                q_data["explanation"] = explanation

        return q_data

    def load(self, experiment_id: str, question_id: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """
        Load quiz context for AI (catalog / active attempt).

        Args:
            experiment_id: ID of the experiment
            question_id: Optional specific question ID

        Returns:
            Dict with quiz context, or None if not found

        Raises:
            HTTPException: If a specific question_id was requested but not found
        """
        questions = self._fetch_questions(experiment_id)

        if not questions:
            return None

        result: Dict[str, Any] = {
            "experiment_id": experiment_id,
            "total_questions": len(questions),
            "questions": [
                self._question_to_ai_data(q, include_explanation=False)
                for q in questions
            ],
        }

        if question_id is not None:
            result["questions"] = [
                q for q in result["questions"] if q["id"] == question_id
            ]
            if not result["questions"]:
                raise HTTPException(status_code=404, detail="Question not found")

        return result

    def load_with_result(
        self,
        experiment_id: str,
        question_id: int,
        student_answer: str,
        is_correct: bool,
        score: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Load quiz context with official result for answered questions.

        Used after the quiz system has determined correctness. Official
        explanation text (from the bank) may be included so the Mentor can
        teach from authoritative quiz data — not invent a grade.
        """
        questions = self._fetch_questions(experiment_id)
        match = next((q for q in questions if q.id == question_id), None)
        if match is None:
            raise HTTPException(status_code=404, detail="Question not found")

        context: Dict[str, Any] = {
            "experiment_id": experiment_id,
            "total_questions": 1,
            "questions": [
                self._question_to_ai_data(match, include_explanation=True)
            ],
            "student_answer": student_answer,
            "is_correct": is_correct,
            "official_result": {
                "correct": is_correct,
                "score": score,
            },
        }
        return context
