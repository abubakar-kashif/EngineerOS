<<<<<<< HEAD
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
=======
from sqlalchemy.orm import Session
from app.models.experiment import Experiment

def seed_database(db: Session):
    """Add initial experiments to the database"""
    
    # Check if experiments already exist
    existing = db.query(Experiment).count()
    if existing > 0:
        print(f"Database already has {existing} experiments. Skipping seed.")
        return
    
    experiments = [
        {
            "name": "ohms-law",
            "slug": "ohms-law",
            "title": "Ohm's Law",
            "short_description": "Explore the relationship between voltage, current, and resistance.",
            "difficulty": "Beginner",
            "category": "Circuit Fundamentals",
            "duration_minutes": 30,
            "status": "published"
        },
        {
            "name": "series-circuit",
            "slug": "series-circuit",
            "title": "Series Circuit",
            "short_description": "Analyze the behavior of components connected in series.",
            "difficulty": "Beginner",
            "category": "Circuit Fundamentals",
            "duration_minutes": 35,
            "status": "published"
        },
        {
            "name": "parallel-circuit",
            "slug": "parallel-circuit",
            "title": "Parallel Circuit",
            "short_description": "Analyze the behavior of components connected in parallel.",
            "difficulty": "Beginner",
            "category": "Circuit Fundamentals",
            "duration_minutes": 35,
            "status": "published"
        }
    ]
    
    for exp_data in experiments:
        experiment = Experiment(**exp_data)
        db.add(experiment)
        print(f"  ✅ Added: {exp_data['title']}")
    
    db.commit()
    print(f"\n✅ Seeded {len(experiments)} experiments!")
>>>>>>> 26d4030 (feat: add backend foundation with database, models, schemas, and API)
