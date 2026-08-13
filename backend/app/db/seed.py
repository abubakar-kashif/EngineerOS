from sqlalchemy import select

from app.db.database import Base, SessionLocal, engine
from app.data.quiz_bank import iter_questions
from app.models.quiz import QuizQuestion


def init_db():
    Base.metadata.create_all(bind=engine)


def seed_quizzes():
    init_db()

    with SessionLocal() as db:
        existing = db.execute(select(QuizQuestion.id)).first()
        if existing is not None:
            return

        for item in iter_questions():
            db.add(QuizQuestion(**item))

        db.commit()


if __name__ == "__main__":
    seed_quizzes()
