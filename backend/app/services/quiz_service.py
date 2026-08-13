from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.quiz import QuizQuestion
from app.schemas.quiz import QuizAnswer, QuizResponse, QuizQuestionResponse, QuizSubmitResponse

PASSING_SCORE = 70.0


def get_quiz_questions(db: Session, experiment_id: str) -> QuizResponse:
    questions = db.execute(
        select(QuizQuestion)
        .where(QuizQuestion.experiment_id == experiment_id)
        .order_by(QuizQuestion.id)
    ).scalars().all()

    if not questions:
        raise HTTPException(status_code=404, detail="Quiz not found")

    return QuizResponse(
        experiment_id=experiment_id,
        questions=[
            QuizQuestionResponse.model_validate(question)
            for question in questions
        ],
    )


def submit_quiz(
    db: Session,
    experiment_id: str,
    answers: list[QuizAnswer],
) -> QuizSubmitResponse:
    if not answers:
        raise HTTPException(status_code=400, detail="Answers cannot be empty")

    question_ids = [answer.question_id for answer in answers]

    if len(question_ids) != len(set(question_ids)):
        raise HTTPException(
            status_code=400,
            detail="Duplicate question IDs are not allowed",
        )

    questions = db.execute(
        select(QuizQuestion)
        .where(
            QuizQuestion.experiment_id == experiment_id,
            QuizQuestion.id.in_(question_ids),
        )
    ).scalars().all()

    question_map = {question.id: question for question in questions}

    invalid_ids = [
        question_id
        for question_id in question_ids
        if question_id not in question_map
    ]

    if invalid_ids:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid question ID(s): {invalid_ids}",
        )

    correct_answers = sum(
        answer.answer == question_map[answer.question_id].correct_answer
        for answer in answers
    )

    total_questions = len(answers)

    if total_questions == 0:
        raise HTTPException(status_code=400, detail="No questions submitted")

    score = round((correct_answers / total_questions) * 100, 2)

    return QuizSubmitResponse(
        score=score,
        total_questions=total_questions,
        correct_answers=correct_answers,
        passed=score >= PASSING_SCORE,
    )
