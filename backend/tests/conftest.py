import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.routes.progress import router as progress_router
from app.db.database import Base, get_db
from app.models.experiment import Experiment
from app.models.progress import Progress


@pytest.fixture()
def progress_client(tmp_path):
    db_path = tmp_path / "progress.db"
    engine = create_engine(
        f"sqlite:///{db_path}",
        connect_args={"check_same_thread": False},
    )
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
    )

    Base.metadata.create_all(bind=engine)

    experiment_ids = [
        "ohms-law",
        "series-circuit",
        "parallel-circuit",
        "kvl",
        "kcl",
        "voltage-divider",
        "current-divider",
        "rc-circuit",
        "diode-characteristics",
        "led-circuit",
    ]

    with TestingSessionLocal() as db:
        for experiment_id in experiment_ids:
            db.add(
                Experiment(
                    id=experiment_id,
                    title=experiment_id.replace("-", " ").title(),
                    slug=experiment_id,
                    short_description="Test experiment",
                    description="Test experiment description",
                    objective="Test objective",
                    theory="Test theory",
                    difficulty="Beginner",
                    category="Test",
                    duration_minutes=30,
                    status="active",
                )
            )
        db.commit()

    app = FastAPI(title="EngineerOS Progress Test API")
    app.include_router(progress_router)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as client:
        yield client, TestingSessionLocal

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
