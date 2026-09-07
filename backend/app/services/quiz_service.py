from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.experiment import Experiment
from app.models.quiz import QuizAttempt, QuizQuestion
from app.models.user import User
from app.schemas.progress import ProgressCreate
from app.schemas.quiz import (
    QuizAnswer,
    QuizAttemptResponse,
    QuizResponse,
    QuizQuestionResponse,
    QuizSubmitResponse,
)
from app.services.notification_service import create_notification
from app.services.progress_service import upsert_progress

PASSING_SCORE = 70.0

# Phase 2: an attempt presents a random sample of this many questions from
# the experiment's bank (the whole bank when it is smaller).
QUIZ_ATTEMPT_SIZE = 40


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
    user: User | None = None,
) -> QuizSubmitResponse:
    """Grade a quiz submission.

    Phase 2: clients submit a random QUIZ_ATTEMPT_SIZE sample of the bank
    (legacy clients may still submit the full bank), so the score is
    computed over the submitted answers. Authenticated submissions are
    persisted as a QuizAttempt (answers plus grade), fire a notification,
    and — when passed — mark the experiment as completed in progress
    (Quiz → Attempt → Score → Progress). Anonymous submissions stay
    stateless, exactly as before Phase 9.
    """
    if not answers:
        raise HTTPException(status_code=400, detail="Answers cannot be empty")

    question_ids = [answer.question_id for answer in answers]

    if len(question_ids) != len(set(question_ids)):
        raise HTTPException(
            status_code=400,
            detail="Duplicate question IDs are not allowed",
        )

    all_questions = db.execute(
        select(QuizQuestion)
        .where(QuizQuestion.experiment_id == experiment_id)
        .order_by(QuizQuestion.id)
    ).scalars().all()

    if not all_questions:
        raise HTTPException(status_code=404, detail="Quiz not found")

    question_map = {question.id: question for question in all_questions}

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

    # Phase 2: the submission must cover a complete attempt — at least
    # QUIZ_ATTEMPT_SIZE questions (the whole bank when it is smaller).
    # Full-bank submissions from older clients remain valid.
    min_answers = min(len(all_questions), QUIZ_ATTEMPT_SIZE)
    if len(question_ids) < min_answers:
        raise HTTPException(
            status_code=400,
            detail=(
                f"A complete attempt must answer at least {min_answers} "
                f"of {len(all_questions)} questions"
            ),
        )

    correct_answers = sum(
        answer.answer == question_map[answer.question_id].correct_answer
        for answer in answers
    )

    # Graded over the attempted questions, matching the client's attempt view.
    total_questions = len(question_ids)
    score = round((correct_answers / total_questions) * 100, 2)
    passed = score >= PASSING_SCORE

    if user is not None:
        _record_attempt(
            db,
            user=user,
            experiment_id=experiment_id,
            answers=answers,
            score=score,
            total_questions=total_questions,
            correct_answers=correct_answers,
            passed=passed,
        )

    return QuizSubmitResponse(
        score=score,
        total_questions=total_questions,
        correct_answers=correct_answers,
        passed=passed,
    )


def list_quiz_attempts(db: Session, user: User) -> list[QuizAttemptResponse]:
    """The user's graded quiz attempts, newest first (capped for the feed)."""
    attempts = (
        db.execute(
            select(QuizAttempt)
            .where(QuizAttempt.user_id == user.id)
            .order_by(QuizAttempt.created_at.desc(), QuizAttempt.id.desc())
            .limit(50)
        )
        .scalars()
        .all()
    )
    return [QuizAttemptResponse.model_validate(attempt) for attempt in attempts]


def _experiment_title(db: Session, experiment_id: str) -> str:
    title = db.execute(
        select(Experiment.title).where(Experiment.id == experiment_id)
    ).scalar_one_or_none()
    return title or experiment_id


def _record_attempt(
    db: Session,
    user: User,
    experiment_id: str,
    answers: list[QuizAnswer],
    score: float,
    total_questions: int,
    correct_answers: int,
    passed: bool,
) -> QuizAttempt:
    """Persist the graded attempt and trigger its follow-up effects."""
    attempt = QuizAttempt(
        user_id=user.id,
        experiment_id=experiment_id,
        score=score,
        total_questions=total_questions,
        correct_answers=correct_answers,
        passed=passed,
        answers=[answer.model_dump() for answer in answers],
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    preferences = user.preferences
    if preferences is None or preferences.notify_quiz_results:
        outcome = "passed" if passed else "not passed"
        create_notification(
            db,
            user_id=user.id,
            type="quiz_result",
            title="Quiz results ready",
            message=f"You scored {score:g}% on {_experiment_title(db, experiment_id)} — {outcome}.",
            meta={
                "experiment_id": experiment_id,
                "attempt_id": attempt.id,
                "score": score,
                "passed": passed,
            },
        )

    if passed:
        # A passing grade completes the experiment for this user.
        upsert_progress(
            db,
            ProgressCreate(experiment_id=experiment_id, status="completed"),
            user,
        )

    return attempt
