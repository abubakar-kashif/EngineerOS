from sqlalchemy import select

from app.db.database import Base, SessionLocal, engine
from app.models.resource import Resource


RESOURCES = [
    {
        "id": "ohms-law-notes",
        "title": "Ohm's Law Notes",
        "type": "document",
        "description": "Engineering notes covering voltage, current, resistance, and Ohm's Law.",
        "url": None,
    },
    {
        "id": "series-circuit-notes",
        "title": "Series Circuit Notes",
        "type": "document",
        "description": "Learning material covering current and voltage behavior in series circuits.",
        "url": None,
    },
    {
        "id": "kvl-kcl-reference",
        "title": "KVL and KCL Reference",
        "type": "reference",
        "description": "Quick reference material for Kirchhoff's Voltage and Current Laws.",
        "url": None,
    },
    {
        "id": "electrical-formulas",
        "title": "Electrical Engineering Formula Reference",
        "type": "reference",
        "description": "A basic reference collection of commonly used electrical engineering formulas.",
        "url": None,
    },
]


def seed_resources() -> None:
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        existing_ids = set(db.execute(select(Resource.id)).scalars().all())

        for item in RESOURCES:
            if item["id"] in existing_ids:
                continue
            db.add(Resource(**item))

        db.commit()


if __name__ == "__main__":
    seed_resources()
