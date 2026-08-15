import os
from pathlib import Path

TEST_DB = Path(__file__).resolve().parent / "test_progress.db"
if TEST_DB.exists():
    TEST_DB.unlink()

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB}"

from fastapi.testclient import TestClient

from app.db.database import Base, engine
from app.main import app


Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)


def test_get_progress_empty():
    response = client.get("/api/progress")

    assert response.status_code == 200
    assert response.json() == {
        "completed_experiments": 0,
        "completed_quizzes": 0,
        "average_quiz_score": 0.0,
        "overall_progress": 0.0,
    }


def test_create_completed_progress():
    response = client.post(
        "/api/progress",
        json={
            "experiment_id": "ohms-law",
            "status": "completed",
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["experiment_id"] == "ohms-law"
    assert data["status"] == "completed"
    assert isinstance(data["id"], int)


def test_progress_summary_after_completion():
    response = client.get("/api/progress")

    assert response.status_code == 200
    assert response.json()["completed_experiments"] == 1
    assert response.json()["completed_quizzes"] == 0
    assert response.json()["average_quiz_score"] == 0.0
    assert response.json()["overall_progress"] == 10.0


def test_progress_can_be_updated():
    response = client.post(
        "/api/progress",
        json={
            "experiment_id": "ohms-law",
            "status": "in_progress",
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "in_progress"

    summary = client.get("/api/progress")
    assert summary.json()["completed_experiments"] == 0


def test_invalid_status_rejected():
    response = client.post(
        "/api/progress",
        json={
            "experiment_id": "ohms-law",
            "status": "finished",
        },
    )

    assert response.status_code == 422


def test_empty_experiment_id_rejected():
    response = client.post(
        "/api/progress",
        json={
            "experiment_id": "",
            "status": "completed",
        },
    )

    assert response.status_code == 422


def test_missing_status_rejected():
    response = client.post(
        "/api/progress",
        json={
            "experiment_id": "ohms-law",
        },
    )

    assert response.status_code == 422


def test_missing_experiment_id_rejected():
    response = client.post(
        "/api/progress",
        json={
            "status": "completed",
        },
    )

    assert response.status_code == 422
