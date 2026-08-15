import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.routes.reports import router as reports_router
from app.api.routes.resources import router as resources_router
from app.db.database import Base, get_db
from app.db.seed_resources import seed_resources
from app.models.experiment import Experiment
from app.models.report import Report
from app.models.resource import Resource


@pytest.fixture()
def reports_resources_client(tmp_path):
    db_path = tmp_path / "reports_resources.db"
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
        db.add(
            Experiment(
                id="ohms-law",
                title="Ohm's Law",
                slug="ohms-law",
                short_description="Explore Ohm's Law.",
                description="Test experiment description.",
                objective="Understand Ohm's Law.",
                theory="V = I x R.",
                difficulty="Beginner",
                category="Circuit Fundamentals",
                duration_minutes=30,
                status="active",
            )
        )
        db.commit()

        db.add(
            Resource(
                id="ohms-law-notes",
                title="Ohm's Law Notes",
                type="document",
                description="Notes for Ohm's Law.",
                url=None,
            )
        )
        db.commit()

    app = FastAPI(title="EngineerOS Reports and Resources Test API")
    app.include_router(reports_router)
    app.include_router(resources_router)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as client:
        yield client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


def test_get_reports_empty(reports_resources_client):
    response = reports_resources_client.get("/api/reports")
    assert response.status_code == 200
    assert response.json() == []


def test_create_report(reports_resources_client):
    response = reports_resources_client.post(
        "/api/reports",
        json={
            "experiment_id": "ohms-law",
            "title": "Ohm's Law Experiment",
            "observations": "Measured voltage and current values.",
            "conclusion": "The results followed Ohm's Law.",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["id"] == 1
    assert data["experiment_id"] == "ohms-law"
    assert data["title"] == "Ohm's Law Experiment"
    assert data["status"] == "generated"


def test_create_report_invalid_experiment(reports_resources_client):
    response = reports_resources_client.post(
        "/api/reports",
        json={
            "experiment_id": "missing-experiment",
            "title": "Invalid Report",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Experiment not found"


def test_get_report(reports_resources_client):
    created = reports_resources_client.post(
        "/api/reports",
        json={
            "experiment_id": "ohms-law",
            "title": "Ohm's Law Experiment",
        },
    )
    report_id = created.json()["id"]

    response = reports_resources_client.get(f"/api/reports/{report_id}")
    assert response.status_code == 200
    assert response.json()["id"] == report_id


def test_get_missing_report(reports_resources_client):
    response = reports_resources_client.get("/api/reports/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Report not found"


def test_report_validation(reports_resources_client):
    response = reports_resources_client.post(
        "/api/reports",
        json={"experiment_id": "", "title": ""},
    )
    assert response.status_code == 422


def test_get_resources(reports_resources_client):
    response = reports_resources_client.get("/api/resources")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["id"] == "ohms-law-notes"


def test_get_resource(reports_resources_client):
    response = reports_resources_client.get("/api/resources/ohms-law-notes")
    assert response.status_code == 200
    assert response.json()["title"] == "Ohm's Law Notes"


def test_get_missing_resource(reports_resources_client):
    response = reports_resources_client.get("/api/resources/missing")
    assert response.status_code == 404
    assert response.json()["detail"] == "Resource not found"
