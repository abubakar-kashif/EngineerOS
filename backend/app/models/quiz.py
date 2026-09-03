from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text

from app.db.database import Base


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    experiment_id = Column(String(100), nullable=False, index=True)
    question = Column(Text, nullable=False)
    option_a = Column(String(500), nullable=False)
    option_b = Column(String(500), nullable=False)
    option_c = Column(String(500), nullable=False)
    option_d = Column(String(500), nullable=False)
    correct_answer = Column(String(1), nullable=False)
    explanation = Column(Text, nullable=False)


class QuizAttempt(Base):
    """A graded quiz submission, owned by an authenticated user.

    Connecting Quiz → Attempt → Answers → Submission → Score → Progress:
    every attempt stores the submitted answers and the grade the backend
    computed, so quiz history and averages are derivable per user.
    """

    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        String(32),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    experiment_id = Column(String(100), nullable=False, index=True)
    score = Column(Float, nullable=False)
    total_questions = Column(Integer, nullable=False)
    correct_answers = Column(Integer, nullable=False)
    passed = Column(Boolean, nullable=False, default=False)
    answers = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
