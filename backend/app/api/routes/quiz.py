from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_optional_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.quiz import (
    QuizAttemptResponse,
    QuizResponse,
    QuizSubmitRequest,
    QuizSubmitResponse,
)
from app.services.quiz_service import get_quiz_questions, list_quiz_attempts, submit_quiz

router = APIRouter(prefix="/api/quizzes", tags=["Quiz"])


@router.get("/me/attempts", response_model=list[QuizAttemptResponse])
def get_my_quiz_attempts(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """The signed-in user's graded quiz attempts, newest first."""
    return list_quiz_attempts(db, user)


@router.get("/{experiment_id}", response_model=QuizResponse)
def get_quiz(
    experiment_id: str,
    db: Session = Depends(get_db),
):
    return get_quiz_questions(db, experiment_id)


@router.post("/{experiment_id}/submit", response_model=QuizSubmitResponse)
def submit_quiz_answers(
    experiment_id: str,
    payload: QuizSubmitRequest,
    user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    return submit_quiz(db, experiment_id, payload.answers, user)
