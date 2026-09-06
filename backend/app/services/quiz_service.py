import random
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.data.quiz_difficulty import ALLOWED_COUNTS, DIFFICULTIES, count_by_difficulty
from app.models.experiment import Experiment
from app.models.quiz import QuizAttempt, QuizQuestion
from app.models.user import User
from app.schemas.progress import ProgressCreate
from app.schemas.quiz import (
    QuizAnswer,
    QuizAttemptResponse,
    QuizAvailabilityResponse,
    QuizResponse,
    QuizQuestionResponse,
    QuizStartRequest,
    QuizSubmitResponse,
)
from app.services.notification_service import create_notification
from app.services.progress_service import upsert_progress

PASSING_SCORE = 70.0

# Legacy constant kept for older clients / docs; new attempts use start().
QUIZ_ATTEMPT_SIZE = 20


def _load_bank(db: Session, experiment_id: str) -> list[QuizQuestion]:
    questions = db.execute(
        select(QuizQuestion)
        .where(QuizQuestion.experiment_id == experiment_id)
        .order_by(QuizQuestion.id)
    ).scalars().all()
    if not questions:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return list(questions)


def get_quiz_questions(db: Session, experiment_id: str) -> QuizResponse:
    """Return the full bank (no answers). Prefer /start for an attempt sample."""
    questions = _load_bank(db, experiment_id)
    return QuizResponse(
        experiment_id=experiment_id,
        questions=[QuizQuestionResponse.model_validate(q) for q in questions],
        available=len(questions),
    )


def get_quiz_availability(db: Session, experiment_id: str) -> QuizAvailabilityResponse:
    questions = _load_bank(db, experiment_id)
    return QuizAvailabilityResponse(
        experiment_id=experiment_id,
        counts=count_by_difficulty(questions),
        allowed_counts=list(ALLOWED_COUNTS),
        allowed_difficulties=list(DIFFICULTIES),
    )


def start_quiz(
    db: Session,
    experiment_id: str,
    payload: QuizStartRequest,
) -> QuizResponse:
    """Filter by difficulty, then sample a unique set of the requested size."""
    difficulty = payload.difficulty
    count = int(payload.question_count)

    if difficulty not in DIFFICULTIES:
        raise HTTPException(status_code=400, detail="Unsupported difficulty")
    if count not in ALLOWED_COUNTS:
        raise HTTPException(
            status_code=400,
            detail=f"question_count must be one of {list(ALLOWED_COUNTS)}",
        )

    bank = _load_bank(db, experiment_id)
    pool = [q for q in bank if (q.difficulty or "").lower() == difficulty]
    available = len(pool)

    if available < count:
        raise HTTPException(
            status_code=400,
            detail=(
                f"{count} {difficulty.capitalize()} questions are not currently available. "
                f"Available: {available}. Please choose a smaller quiz or another difficulty."
            ),
        )

    selected = random.sample(pool, count)
    # Stable display order by id within the random sample
    selected.sort(key=lambda q: q.id)

    return QuizResponse(
        experiment_id=experiment_id,
        questions=[QuizQuestionResponse.model_validate(q) for q in selected],
        difficulty=difficulty,
        question_count=count,
        available=available,
    )


def submit_quiz(
    db: Session,
    experiment_id: str,
    answers: list[QuizAnswer],
    user: User | None = None,
    *,
    difficulty: str | None = None,
    question_count: int | None = None,
) -> QuizSubmitResponse:
    """Grade a quiz submission.

    Attempts must use unique question IDs. When difficulty/question_count are
    provided (Phase 1), every answered question must match that difficulty and
    the answer count must equal the requested size.
    """
    if not answers:
        raise HTTPException(status_code=400, detail="Answers cannot be empty")

    question_ids = [answer.question_id for answer in answers]

    if len(question_ids) != len(set(question_ids)):
        raise HTTPException(
            status_code=400,
            detail="Duplicate question IDs are not allowed",
        )

    all_questions = _load_bank(db, experiment_id)
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

    if difficulty is not None:
        difficulty = difficulty.lower()
        if difficulty not in DIFFICULTIES:
            raise HTTPException(status_code=400, detail="Unsupported difficulty")
        mixed = [
            qid
            for qid in question_ids
            if (question_map[qid].difficulty or "").lower() != difficulty
        ]
        if mixed:
            raise HTTPException(
                status_code=400,
                detail="All submitted questions must match the selected difficulty",
            )

    if question_count is not None:
        if question_count not in ALLOWED_COUNTS:
            raise HTTPException(
                status_code=400,
                detail=f"question_count must be one of {list(ALLOWED_COUNTS)}",
            )
        if len(question_ids) != question_count:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"A complete attempt must answer exactly {question_count} questions"
                ),
            )
    else:
        # Legacy / flexible path: accept 10, 20, 40, or a full-bank submission.
        allowed = set(ALLOWED_COUNTS) | {len(all_questions)}
        if len(question_ids) not in allowed:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"A complete attempt must answer one of "
                    f"{sorted(ALLOWED_COUNTS)} questions "
                    f"(or the full bank of {len(all_questions)})"
                ),
            )

    correct_answers = sum(
        answer.answer == question_map[answer.question_id].correct_answer
        for answer in answers
    )

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
        upsert_progress(
            db,
            ProgressCreate(experiment_id=experiment_id, status="completed"),
            user,
        )

    return attempt
