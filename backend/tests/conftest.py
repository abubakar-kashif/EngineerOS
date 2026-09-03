import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.routes.experiments import router as experiments_router
from app.api.routes.simulations import router as simulations_router
from app.api.routes.auth import router as auth_router
from app.api.routes.conversations import router as conversations_router
from app.api.routes.notifications import router as notifications_router
from app.api.routes.progress import router as progress_router
from app.api.routes.quiz import router as quiz_router
from app.api.routes.reports import router as reports_router
from app.api.routes.users import router as users_router
from app.data.quiz_bank import iter_questions
from app.db.database import Base, get_db
from app.models.experiment import Experiment
from app.models.progress import Progress
from app.models.quiz import QuizQuestion

EXPERIMENT_IDS = [
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


def seed_test_experiments(db):
    """Insert the standard ten experiments used across the test suite."""
    for experiment_id in EXPERIMENT_IDS:
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

    with TestingSessionLocal() as db:
        seed_test_experiments(db)
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


@pytest.fixture()
def phase9_client(tmp_path):
    """Full API surface (auth, users, notifications, conversations, quiz,
    progress, reports) backed by an isolated per-test SQLite database seeded
    with the ten experiments and the quiz bank.

    Yields (client, session_factory) so tests can also inspect rows directly.
    """
    db_path = tmp_path / "phase9.db"
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

    with TestingSessionLocal() as db:
        seed_test_experiments(db)
        for item in iter_questions():
            db.add(QuizQuestion(**item))
        db.commit()

    app = FastAPI(title="EngineerOS Phase 9 Test API")
    for router in (
        auth_router,
        users_router,
        notifications_router,
        conversations_router,
        quiz_router,
        progress_router,
        reports_router,
        experiments_router,      # <-- Add this
        simulations_router,      
    ):
        app.include_router(router)

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
