from sqlalchemy import Column, Integer, String, Text

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
