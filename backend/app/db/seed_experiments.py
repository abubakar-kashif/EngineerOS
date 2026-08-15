from sqlalchemy import select

from app.db.database import Base, SessionLocal, engine
from app.models.experiment import Experiment


EXPERIMENTS = [
    ("ohms-law", "Ohm's Law", "Circuit Fundamentals", 30),
    ("series-circuit", "Series Circuit", "Circuit Fundamentals", 30),
    ("parallel-circuit", "Parallel Circuit", "Circuit Fundamentals", 30),
    ("kvl", "Kirchhoff's Voltage Law", "Circuit Analysis", 30),
    ("kcl", "Kirchhoff's Current Law", "Circuit Analysis", 30),
    ("voltage-divider", "Voltage Divider", "Circuit Analysis", 25),
    ("current-divider", "Current Divider", "Circuit Analysis", 25),
    ("rc-circuit", "RC Circuit", "Circuit Analysis", 35),
    ("diode-characteristics", "Diode Characteristics", "Electronic Devices", 35),
    ("led-circuit", "LED Circuit", "Electronic Devices", 30),
]


def seed_experiments() -> None:
    """Create the experiment table and seed the Week 1 experiments."""
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        existing = set(db.execute(select(Experiment.id)).scalars().all())

        for experiment_id, title, category, duration in EXPERIMENTS:
            if experiment_id in existing:
                continue

            db.add(
                Experiment(
                    id=experiment_id,
                    title=title,
                    slug=experiment_id,
                    short_description=f"Explore {title} in an engineering learning experiment.",
                    description=f"EngineerOS learning content for {title}.",
                    objective=f"Understand the fundamentals of {title}.",
                    theory=f"Core theory and concepts for {title}.",
                    difficulty="Beginner",
                    category=category,
                    duration_minutes=duration,
                    status="active",
                )
            )

        db.commit()
