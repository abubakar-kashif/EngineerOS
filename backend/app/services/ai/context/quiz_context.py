from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.quiz import QuizQuestion
from app.services.quiz_service import get_quiz_questions


class QuizContext:
    """
    Loads authoritative quiz data and converts to AI-readable context.

    This adapter reads quiz information from the quiz system.
    It does NOT modify scores, correctness, or attempt states.
    """

    def __init__(self, db: Session):
        self.db = db

    def load(self, experiment_id: str, question_id: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """
        Load quiz context for AI.

        Args:
            experiment_id: ID of the experiment
            question_id: Optional specific question ID

        Returns:
            Dict with quiz context, or None if not found

        Raises:
            HTTPException: If quiz not found
        """
        questions = get_quiz_questions(self.db, experiment_id)

        if not questions:
            return None

        result = {
            "experiment_id": experiment_id,
            "total_questions": len(questions.questions),
            "questions": []
        }

        for q in questions.questions:
            q_data = {
                "id": q.id,
                "question": q.question,
                "options": [
                    q.option_a,
                    q.option_b,
                    q.option_c,
                    q.option_d,
                ],
                # Note: correct_answer is NOT included for active quizzes
                # to prevent the AI from giving away answers
            }

            # Only include explanation if available and appropriate
            if q.explanation:
                q_data["explanation"] = q.explanation

            result["questions"].append(q_data)

        # If specific question requested, filter to that one
        if question_id:
            result["questions"] = [q for q in result["questions"] if q["id"] == question_id]
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

        This is used when the student has already submitted an answer
        and the quiz system has determined correctness.

        Args:
            experiment_id: ID of the experiment
            question_id: ID of the question
            student_answer: The student's submitted answer
            is_correct: Official correctness from quiz system
            score: Optional score if available

        Returns:
            Dict with quiz context including official result

        Raises:
            HTTPException: If question not found
        """
        context = self.load(experiment_id, question_id)

        if not context or not context.get("questions"):
            raise HTTPException(status_code=404, detail="Question not found")

        # Add official result (from quiz system, NOT AI)
        context["student_answer"] = student_answer
        context["is_correct"] = is_correct
        context["official_result"] = {
            "correct": is_correct,
            "score": score,
        }

        return context