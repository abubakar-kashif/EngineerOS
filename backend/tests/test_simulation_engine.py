import pytest
import json
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.database import get_db, Base
from app.models.simulation import Simulation, SimulationStatus
from app.models.user import User
from app.api.deps import get_current_user
from app.services.engine_adapter import run_engine

# ---- Fixture with a seeded database and auth override ----
@pytest.fixture
def client():
    SQLALCHEMY_DATABASE_URL = "sqlite:///./test_sim.db"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        try:
            db = TestingSessionLocal()
            yield db
        finally:
            db.close()

    def override_get_current_user():
        return User(id="test-user-1", email="test@example.com", name="Test User")

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    with TestClient(app) as test_client:
        # Attach the session factory to the yielded client
        test_client._testing_session_local = TestingSessionLocal
        yield test_client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
# ---- Tests that call the engine directly (no API) ----
def test_valid_circuit_validation():
    circuit = {
        "components": [
            {"id": "V1", "label": "V1", "type": "voltage_source", "properties": {"voltage": 12}, "terminals": ["positive", "negative"], "position": {"x": 0, "y": 0}},
            {"id": "R1", "label": "R1", "type": "resistor", "properties": {"resistance": 1000}, "terminals": ["A", "B"], "position": {"x": 100, "y": 0}},
            {"id": "GND", "label": "GND", "type": "ground", "terminals": ["ground"], "position": {"x": 200, "y": 0}}
        ],
        "connections": [
            {"from": "V1:positive", "to": "R1:A"},
            {"from": "R1:B", "to": "GND:ground"},
            {"from": "V1:negative", "to": "GND:ground"}
        ]
    }
    result = run_engine(circuit)
    assert result["status"] == "completed"
    assert "measurements" in result

def test_invalid_circuit():
    circuit = {
        "components": [
            {"id": "V1", "label": "V1", "type": "voltage_source", "properties": {"voltage": 12}, "terminals": ["positive", "negative"], "position": {"x": 0, "y": 0}}
        ],
        "connections": []
    }
    result = run_engine(circuit)
    assert result["status"] == "invalid"
    assert result["validation"]["valid"] is False

# ---- API integration tests using the client fixture ----
def test_create_simulation_with_auth(client):
    payload = {
        "name": "Test Simulation",
        "experiment_id": "exp-123",
        "circuit_definition": {"components": [], "connections": []}
    }
    response = client.post("/api/simulations/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Simulation"
    assert data["user_id"] == "test-user-1"
    assert data["status"] == "idle"
    assert "id" in data

def test_validate_simulation_updates_status(client):
    circuit_def = {
        "components": [
            {"id": "V1", "label": "V1", "type": "voltage_source", "properties": {"voltage": 12}, "terminals": ["positive", "negative"], "position": {"x": 0, "y": 0}},
            {"id": "R1", "label": "R1", "type": "resistor", "properties": {"resistance": 1000}, "terminals": ["A", "B"], "position": {"x": 100, "y": 0}},
            {"id": "GND", "label": "GND", "type": "ground", "terminals": ["ground"], "position": {"x": 200, "y": 0}}
        ],
        "connections": [
            {"from": "V1:positive", "to": "R1:A"},
            {"from": "R1:B", "to": "GND:ground"},
            {"from": "V1:negative", "to": "GND:ground"}
        ]
    }
    create_resp = client.post("/api/simulations/", json={"name": "Validate Test", "circuit_definition": circuit_def})
    sim_id = create_resp.json()["id"]

    validate_resp = client.post(f"/api/simulations/{sim_id}/validate")
    assert validate_resp.status_code == 200
    val_data = validate_resp.json()
    assert val_data["valid"] is True
    assert val_data["errors"] == []

    # Check DB status using the stored session factory
    db = client._testing_session_local()
    sim = db.query(Simulation).filter(Simulation.id == sim_id).first()
    assert sim.status == SimulationStatus.READY
    assert sim.validation_errors == []
    db.close()

def test_run_simulation_persists_results(client):
    circuit_def = {
        "components": [
            {"id": "V1", "label": "V1", "type": "voltage_source", "properties": {"voltage": 12}, "terminals": ["positive", "negative"], "position": {"x": 0, "y": 0}},
            {"id": "R1", "label": "R1", "type": "resistor", "properties": {"resistance": 1000}, "terminals": ["A", "B"], "position": {"x": 100, "y": 0}},
            {"id": "GND", "label": "GND", "type": "ground", "terminals": ["ground"], "position": {"x": 200, "y": 0}}
        ],
        "connections": [
            {"from": "V1:positive", "to": "R1:A"},
            {"from": "R1:B", "to": "GND:ground"},
            {"from": "V1:negative", "to": "GND:ground"}
        ]
    }
    create_resp = client.post("/api/simulations/", json={"name": "Run Test", "circuit_definition": circuit_def})
    sim_id = create_resp.json()["id"]

    run_resp = client.post(f"/api/simulations/{sim_id}/run", json={"circuit_definition": circuit_def})
    assert run_resp.status_code == 200
    result_data = run_resp.json()
    assert result_data["status"] == "completed"
    assert "measurements" in result_data
    assert "dcResult" in result_data
    assert "validation" in result_data
    # Closed loop: each run exposes a fresh SimulationRun id for Mentor
    meta = result_data.get("metadata") or {}
    assert meta.get("simulation_run_id")
    assert meta.get("simulation_id") == sim_id

    db = client._testing_session_local()
    sim = db.query(Simulation).filter(Simulation.id == sim_id).first()
    assert sim.status == SimulationStatus.COMPLETED
    assert sim.results is not None
    assert sim.measurements is not None
    assert sim.validation_errors == []
    assert sim.completed_at is not None
    from app.models.simulation import SimulationRun
    run = db.query(SimulationRun).filter(SimulationRun.id == meta["simulation_run_id"]).first()
    assert run is not None
    assert run.results is not None
    db.close()

    # Second run must mint a new SimulationRun id (no stale Mentor context)
    run_resp2 = client.post(f"/api/simulations/{sim_id}/run", json={"circuit_definition": circuit_def})
    assert run_resp2.status_code == 200
    meta2 = (run_resp2.json().get("metadata") or {})
    assert meta2.get("simulation_run_id")
    assert meta2["simulation_run_id"] != meta["simulation_run_id"]

def test_json_serialization_no_maps(client):
    circuit_def = {
        "components": [
            {"id": "V1", "label": "V1", "type": "voltage_source", "properties": {"voltage": 12}, "terminals": ["positive", "negative"], "position": {"x": 0, "y": 0}},
            {"id": "R1", "label": "R1", "type": "resistor", "properties": {"resistance": 1000}, "terminals": ["A", "B"], "position": {"x": 100, "y": 0}},
            {"id": "GND", "label": "GND", "type": "ground", "terminals": ["ground"], "position": {"x": 200, "y": 0}}
        ],
        "connections": [
            {"from": "V1:positive", "to": "R1:A"},
            {"from": "R1:B", "to": "GND:ground"},
            {"from": "V1:negative", "to": "GND:ground"}
        ]
    }
    create_resp = client.post("/api/simulations/", json={"name": "Serialization Test", "circuit_definition": circuit_def})
    sim_id = create_resp.json()["id"]

    run_resp = client.post(f"/api/simulations/{sim_id}/run", json={"circuit_definition": circuit_def})
    assert run_resp.status_code == 200
    data = run_resp.json()

    dc = data.get("dcResult")
    assert dc is not None
    node_voltages = dc.get("nodeVoltages")
    assert isinstance(node_voltages, dict)

    json_str = json.dumps(data)  # Should succeed

    measurements = data.get("measurements")
    assert measurements is not None
    assert "totalVoltage" in measurements
    assert isinstance(measurements["componentMeasurements"], list)