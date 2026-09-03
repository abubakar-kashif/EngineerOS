import pytest
import json
from app.services.engine_adapter import run_engine

def test_valid_circuit_validation():
    circuit = {
        "components": [
            {
                "id": "V1",
                "label": "V1",
                "type": "voltage_source",
                "properties": {"voltage": 12},
                "terminals": ["positive", "negative"],
                "position": {"x": 0, "y": 0}
            },
            {
                "id": "R1",
                "label": "R1",
                "type": "resistor",
                "properties": {"resistance": 1000},
                "terminals": ["A", "B"],
                "position": {"x": 100, "y": 0}
            },
            {
                "id": "GND",
                "label": "GND",
                "type": "ground",
                "terminals": ["ground"],
                "position": {"x": 200, "y": 0}
            }
        ],
        "connections": [
            {"from": "V1:positive", "to": "R1:A"},
            {"from": "R1:B", "to": "GND:ground"},
            {"from": "V1:negative", "to": "GND:ground"}
        ]
    }
    result = run_engine(circuit)
    print("Result:", json.dumps(result, indent=2))  # <-- print for debugging
    assert result["status"] == "completed"
    assert "measurements" in result

def test_invalid_circuit():
    circuit = {
        "components": [
            {
                "id": "V1",
                "label": "V1",
                "type": "voltage_source",
                "properties": {"voltage": 12},
                "terminals": ["positive", "negative"],
                "position": {"x": 0, "y": 0}
            }
        ],
        "connections": []
    }
    result = run_engine(circuit)
    assert result["status"] == "invalid"
    assert result["validation"]["valid"] == False