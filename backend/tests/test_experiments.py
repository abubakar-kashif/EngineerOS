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


def test_experiment_list_stays_lean():
    """The list endpoint serves catalog cards, not the full content payload."""
    response = client.get("/api/experiments")

    assert response.status_code == 200

    item = response.json()["items"][0]

    for rich_field in (
        "historical_background",
        "learning_outcomes",
        "prerequisites",
        "formulas",
        "variables",
        "components",
        "circuit_diagram",
        "procedure",
        "expected_results",
        "common_mistakes",
        "safety_precautions",
        "observation_guidance",
        "real_world_applications",
        "related_experiments",
        "simulation_configuration",
    ):
        assert rich_field not in item, f"{rich_field} leaked into the list response"


def test_get_ohms_law():
    response = client.get("/api/experiments/ohms-law")

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == "ohms-law"
    assert data["title"] == "Ohm's Law"


def test_experiment_detail_content_contract():
    """Every seeded experiment ships the full Phase 4 content package."""
    from app.data.experiment_content import EXPERIMENTS

    experiment_ids = {exp["id"] for exp in EXPERIMENTS}

    for experiment_id in sorted(experiment_ids):
        response = client.get(f"/api/experiments/{experiment_id}")

        assert response.status_code == 200, experiment_id

        data = response.json()

        # Prose fields are non-empty strings.
        for field in ("historical_background", "theory", "objective", "description"):
            assert isinstance(data[field], str) and data[field].strip(), (
                f"{experiment_id}: {field} must be non-empty prose"
            )

        # List fields are non-empty lists of strings.
        for field in (
            "learning_outcomes",
            "procedure",
            "expected_results",
            "safety_precautions",
            "observation_guidance",
            "real_world_applications",
        ):
            assert isinstance(data[field], list) and data[field], (
                f"{experiment_id}: {field} must be a non-empty list"
            )
            assert all(isinstance(item, str) and item.strip() for item in data[field]), (
                f"{experiment_id}: {field} contains empty entries"
            )

        # Structured fields keep their documented shapes.
        assert data["formulas"], f"{experiment_id}: formulas missing"
        for formula in data["formulas"]:
            assert formula["expression"].strip()
            assert all(var["symbol"] and var["name"] for var in formula["variables"])

        assert data["variables"], f"{experiment_id}: variables missing"
        for variable in data["variables"]:
            assert variable["symbol"] and variable["name"]

        assert data["components"], f"{experiment_id}: components missing"
        for component in data["components"]:
            assert component["name"].strip()
            assert isinstance(component["quantity"], int) and component["quantity"] >= 1

        assert data["circuit_diagram"]["art"].strip(), f"{experiment_id}: diagram missing"
        assert data["circuit_diagram"]["art"].count("\n") >= 3

        assert data["common_mistakes"], f"{experiment_id}: common_mistakes missing"
        for mistake in data["common_mistakes"]:
            assert mistake["mistake"].strip() and mistake["consequence"].strip()

        # Cross-references resolve to real experiments.
        assert isinstance(data["prerequisites"], list)
        for reference in data["prerequisites"] + data["related_experiments"]:
            assert reference in experiment_ids, (
                f"{experiment_id}: unknown reference {reference}"
            )

        # Simulation defaults are well-formed.
        simulation = data["simulation_configuration"]
        assert simulation["mode"] in ("series", "parallel")
        assert isinstance(simulation["parameters"], dict)


def test_invalid_experiment():
    response = client.get("/api/experiments/invalid")

    assert response.status_code == 404


def teardown_module():
    app.dependency_overrides.clear()