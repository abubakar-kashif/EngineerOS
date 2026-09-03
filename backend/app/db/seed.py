import sys

from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import hash_password
from app.data.experiment_content import EXPERIMENTS
from app.data.quiz_bank import iter_questions
from app.models.experiment import Experiment
from app.models.quiz import QuizQuestion
from app.models.user import User
from app.db.database import SessionLocal, Base, engine
from app.services.user_service import ensure_preferences

DEMO_EMAIL = "demo@engineeros.dev"
DEMO_PASSWORD = "demo1234"

# Windows consoles/pipes often default to a legacy code page (cp1252) that
# cannot encode the emoji below; degrade gracefully instead of crashing.
if sys.stdout is not None and sys.stdout.encoding and sys.stdout.encoding.lower() not in ("utf-8", "utf8"):
    sys.stdout.reconfigure(errors="replace")


def init_db():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)


def seed_quizzes():
    """Seed or refresh quiz questions from quiz_bank.

    Rows are matched by primary key and reconciled field by field, so
    databases seeded from an older snapshot (the 100-question pre-Phase-6
    bank) pick up new questions, edits, and removals on the next start.
    """
    bank = list(iter_questions())
    bank_ids = {item["id"] for item in bank}

    with SessionLocal() as db:
        existing = {row.id: row for row in db.query(QuizQuestion).all()}

        added = 0
        updated = 0
        for item in bank:
            row = existing.get(item["id"])
            if row is None:
                db.add(QuizQuestion(**item))
                added += 1
                continue
            changed = False
            for key, value in item.items():
                if getattr(row, key) != value:
                    setattr(row, key, value)
                    changed = True
            if changed:
                updated += 1

        removed = 0
        for question_id, row in existing.items():
            if question_id not in bank_ids:
                db.delete(row)
                removed += 1

        if added or updated or removed:
            db.commit()
            print(
                f"  ✅ Quiz questions: {added} added, {updated} updated, "
                f"{removed} removed"
            )
        else:
            print("  ℹ️ Quiz questions up to date")


def seed_experiments(db: Session):
    """Add or refresh the experiment catalog from the content module.

    Existing rows are updated so the canonical content (theory, procedure,
    safety notes, …) reaches databases created before Phase 4.
    """

    added = 0
    updated = 0

    for exp_data in EXPERIMENTS:
        existing = (
            db.query(Experiment)
            .filter(Experiment.id == exp_data["id"])
            .first()
        )

        if existing:
            for key, value in exp_data.items():
                setattr(existing, key, value)
            updated += 1
        else:
            db.add(Experiment(**exp_data))
            added += 1

    db.commit()

    if added or updated:
        print(f"  ✅ Experiments: {added} added, {updated} updated")
    else:
        print("  ℹ️ No experiments to seed")


def seed_demo_user(db: Session):
    """Create a ready-to-use demo account (development only).

    The account is pre-verified so the login flow can be exercised
    immediately after seeding; it is only created when DEBUG is enabled.
    """
    if not settings.DEBUG:
        return

    existing = db.query(User).filter(User.email == DEMO_EMAIL).first()
    if existing:
        print("  ℹ️ Demo user already exists")
        return

    user = User(
        name="Demo Student",
        email=DEMO_EMAIL,
        password_hash=hash_password(DEMO_PASSWORD),
        email_verified=True,
    )
    db.add(user)
    db.commit()

    ensure_preferences(db, user)

    print(f"  ✅ Demo user ready: {DEMO_EMAIL} / {DEMO_PASSWORD}")


def seed_database(db: Session):
    print("🌱 Seeding experiments...")
    seed_experiments(db)

    print("🌱 Seeding quizzes...")
    seed_quizzes()

    print("🌱 Seeding demo user...")
    seed_demo_user(db)

    print("✅ Database seeding complete!")
