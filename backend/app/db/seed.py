from sqlalchemy import select

from app.db.database import Base, SessionLocal, engine
from app.data.quiz_bank import iter_questions
from app.models.quiz import QuizQuestion


def init_db():
    Base.metadata.create_all(bind=engine)


def seed_quizzes():
    init_db()

    with SessionLocal() as db:
        existing_ids = set(db.execute(select(QuizQuestion.id)).scalars().all())

        added = 0
        for item in iter_questions():
            if item["id"] in existing_ids:
                continue
            db.add(QuizQuestion(**item))
            added += 1

        if added:
            db.commit()


if __name__ == "__main__":
    seed_quizzes()
