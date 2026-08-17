from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base, get_db
from app.db.seed import seed_experiments
from app.main import app


TEST_DB = Path(__file__).resolve().parent / "test_experiments.db"

test_engine = create_engine(
    f"sqlite:///{TEST_DB}",
    connect_args={"check_same_thread": False},
)

TestSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
)


Base.metadata.drop_all(bind=test_engine)
Base.metadata.create_all(bind=test_engine)


with TestSessionLocal() as db:
    seed_experiments(db)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


def test_health():
    response = client.get("/api/health")

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "ok"
    assert data["service"] == "EngineerOS API"


def test_get_experiments():
    response = client.get("/api/experiments")

    assert response.status_code == 200

    data = response.json()

    assert "items" in data
    assert "total" in data
    assert data["total"] == 10


def test_get_ohms_law():
    response = client.get("/api/experiments/ohms-law")

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == "ohms-law"
    assert data["title"] == "Ohm's Law"


def test_invalid_experiment():
    response = client.get("/api/experiments/invalid")

    assert response.status_code == 404

def teardown_module():
    app.dependency_overrides.clear()