from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.quiz import QuizResponse, QuizSubmitRequest, QuizSubmitResponse
from app.services.quiz_service import get_quiz_questions, submit_quiz

router = APIRouter(prefix="/api/quizzes", tags=["Quiz"])


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
    db: Session = Depends(get_db),
):
    return submit_quiz(db, experiment_id, payload.answers)
