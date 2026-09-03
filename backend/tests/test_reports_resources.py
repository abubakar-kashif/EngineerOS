import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.api.routes.reports import router as reports_router
from app.api.routes.resources import router as resources_router
from app.db.database import Base, get_db
from app.db.seed_resources import seed_resources
from app.models.experiment import Experiment
from app.models.quiz import QuizAttempt
from app.models.report import Report
from app.models.resource import Resource
from app.models.simulation import SimulationRun
from app.models.user import User


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
                historical_background="Georg Ohm published the law in 1827.",
                difficulty="Beginner",
                category="Circuit Fundamentals",
                duration_minutes=30,
                status="active",
                components=[
                    {"name": "Resistor 1 kΩ", "quantity": 1, "spec": "1/4 W"}
                ],
                circuit_diagram={"art": " +--[R1]--\n |       |\n(V)      |\n |       |\n +-------+", "caption": "Series circuit"},
                procedure=["Connect the resistor.", "Measure the current."],
                expected_results=["Current follows I = V / R."],
                simulation_configuration={
                    "mode": "series",
                    "parameters": {"voltage": 9, "r1": 1000},
                },
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
    assert data["experiment_title"] == "Ohm's Law"
    assert data["title"] == "Ohm's Law Experiment"
    assert data["status"] == "generated"


def test_create_report_documents_experiment_content(reports_resources_client):
    """The report snapshots the experiment's lab-document content."""
    response = reports_resources_client.post(
        "/api/reports",
        json={"experiment_id": "ohms-law", "title": "Ohm's Law Experiment"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["student_name"] is None  # anonymous report
    assert data["objective"] == "Understand Ohm's Law."
    assert data["theory"] == "V = I x R."
    assert data["historical_background"] == "Georg Ohm published the law in 1827."
    assert data["components"] == [
        {"name": "Resistor 1 kΩ", "quantity": 1, "spec": "1/4 W"}
    ]
    assert data["circuit_diagram"]["caption"] == "Series circuit"
    assert data["procedure"] == ["Connect the resistor.", "Measure the current."]

    theoretical = data["theoretical_results"]
    assert theoretical["expected_outcomes"] == ["Current follows I = V / R."]
    assert theoretical["reference_values"] == [
        {"label": "Source Voltage", "value": 9, "unit": "V"},
        {"label": "Total Resistance", "value": 1000, "unit": "Ω"},
        {"label": "Total Current", "value": pytest.approx(0.009), "unit": "A"},
        {"label": "Total Power", "value": pytest.approx(0.081), "unit": "W"},
    ]

    # No simulation run or quiz attempt exists — nothing may be fabricated.
    assert data["measured_results"] is None
    assert data["calculated_results"] is None
    assert data["percentage_error"] is None
    assert data["quiz_performance"] is None


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


def test_report_attaches_user_simulation_and_quiz_data(phase9_client):
    """Measured values come from the user's latest simulation run and quiz
    performance from their latest attempt — computed, never invented."""
    client, session_factory = phase9_client

    # Publish a reference configuration for the experiment.
    with session_factory() as db:
        experiment = db.get(Experiment, "ohms-law")
        experiment.simulation_configuration = {
            "mode": "series",
            "parameters": {"voltage": 9, "r1": 1000},
        }
        db.commit()

    registered = client.post(
        "/api/auth/register",
        json={"name": "Ada Lovelace", "email": "ada@example.com", "password": "supersecret1"},
    )
    assert registered.status_code == 201
    headers = {"Authorization": f"Bearer {registered.json()['token']}"}

    with session_factory() as db:
        user_id = db.execute(
            select(User.id).where(User.email == "ada@example.com")
        ).scalar_one()
        db.add(
            SimulationRun(
                user_id=user_id,
                experiment_id="ohms-law",
                name="Series run",
                circuit_definition={
                    "components": [{"id": "c1", "label": "R1", "type": "resistor"}]
                },
                results={
                    "global": {
                        "sourceVoltage": 9,
                        "totalResistance": 1000,
                        "totalCurrent": 0.008,
                        "totalPower": 0.072,
                    },
                    "components": [
                        {
                            "componentId": "c1",
                            "voltage": 9,
                            "current": 0.008,
                            "power": 0.072,
                            "state": "active",
                        }
                    ],
                },
                status="completed",
            )
        )
        db.add(
            QuizAttempt(
                user_id=user_id,
                experiment_id="ohms-law",
                score=85.0,
                total_questions=20,
                correct_answers=17,
                passed=True,
            )
        )
        db.commit()

    response = client.post(
        "/api/reports",
        headers=headers,
        json={"experiment_id": "ohms-law", "title": "Ada's Lab Report"},
    )
    assert response.status_code == 201
    data = response.json()

    assert data["student_name"] == "Ada Lovelace"
    assert data["experiment_title"] == "Ohms Law"

    labels = {row["label"]: row["value"] for row in data["measured_results"]}
    assert labels["Source Voltage"] == 9
    assert labels["Total Current"] == pytest.approx(0.008)
    # Per-component rows use the circuit's reference designator.
    assert labels["R1 Voltage"] == 9
    assert labels["R1 Current"] == pytest.approx(0.008)
    assert labels["R1 Power"] == pytest.approx(0.072)

    calculated = {row["label"]: row for row in data["calculated_results"]}
    assert calculated["Total Resistance"]["formula"] == "R = V / I"
    assert calculated["Total Resistance"]["value"] == pytest.approx(1125)
    assert calculated["Total Power"]["formula"] == "P = V × I"
    assert calculated["Total Power"]["value"] == pytest.approx(0.072)

    errors = {row["label"]: row for row in data["percentage_error"]}
    assert errors["Source Voltage"]["error_percent"] == pytest.approx(0)
    assert errors["Total Current"]["error_percent"] == pytest.approx(100 / 9)
    assert errors["Total Power"]["error_percent"] == pytest.approx(100 / 9)

    assert data["quiz_performance"] == {
        "score": 85.0,
        "correct_answers": 17,
        "total_questions": 20,
        "passed": True,
    }


def test_report_without_user_data_has_no_measurements(phase9_client):
    """A signed-in user with no simulation run and no quiz attempt gets a
    report with content sections only — no fabricated measurements."""
    client, _ = phase9_client

    registered = client.post(
        "/api/auth/register",
        json={"name": "Ada Lovelace", "email": "no-data@example.com", "password": "supersecret1"},
    )
    headers = {"Authorization": f"Bearer {registered.json()['token']}"}

    response = client.post(
        "/api/reports",
        headers=headers,
        json={"experiment_id": "ohms-law", "title": "Theory-only Report"},
    )
    assert response.status_code == 201
    data = response.json()

    assert data["student_name"] == "Ada Lovelace"
    assert data["objective"] == "Test objective"  # copied from the experiment
    assert data["theory"] == "Test theory"
    assert data["measured_results"] is None
    assert data["calculated_results"] is None
    assert data["percentage_error"] is None
    assert data["quiz_performance"] is None
    # The seeded test experiment has no reference configuration either.
    assert data["theoretical_results"] is None


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
