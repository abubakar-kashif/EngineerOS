"""Phase 7 — Simulation Mentor grounded in live circuit + SimulationRun."""

from app.services.ai.context.simulation_context import (
    apply_live_editor_circuit,
    summarize_circuit_definition,
)
from app.services.ai.context_engine import ContextResult
from app.services.ai.prompt_builder import PromptBuilder


DIVIDER = {
    "components": [
        {
            "id": "V1",
            "type": "voltage_source",
            "label": "V1",
            "properties": {"voltage": 12},
            "terminals": [
                {"id": "V1.positive", "type": "positive"},
                {"id": "V1.negative", "type": "negative"},
            ],
        },
        {
            "id": "R1",
            "type": "resistor",
            "label": "R1",
            "properties": {"resistance": 1000},
            "terminals": [
                {"id": "R1.A", "type": "A"},
                {"id": "R1.B", "type": "B"},
            ],
        },
        {
            "id": "R2",
            "type": "resistor",
            "label": "R2",
            "properties": {"resistance": 2000},
            "terminals": [
                {"id": "R2.A", "type": "A"},
                {"id": "R2.B", "type": "B"},
            ],
        },
    ],
    "connections": [
        {"id": "W1", "from": "V1.positive", "to": "R1.A"},
        {"id": "W2", "from": "R1.B", "to": "R2.A"},
        {"id": "W3", "from": "R2.B", "to": "V1.negative"},
    ],
}

CHANGED_R2 = {
    **DIVIDER,
    "components": [
        DIVIDER["components"][0],
        DIVIDER["components"][1],
        {
            **DIVIDER["components"][2],
            "properties": {"resistance": 4000},
        },
    ],
}


def _run_context(run_id: str, circuit: dict) -> dict:
    summary = summarize_circuit_definition(circuit)
    return {
        "simulation_run_id": run_id,
        "status": "completed",
        "circuit": summary,
        "authority": "These values come from the EngineerOS simulator.",
        "dc_result": {
            "success": True,
            "total_current": 0.004,
            "total_power": 0.048,
            "equivalent_resistance": 3000.0,
            "node_voltages": {"n1": 12.0, "n2": 8.0},
            "branch_currents": {"R1": 0.004},
            "component_results": [
                {"component_id": "R1", "voltage": 4.0, "current": 0.004, "power": 0.016},
                {"component_id": "R2", "voltage": 8.0, "current": 0.004, "power": 0.032},
            ],
        },
        "measurements": {
            "total_voltage": 12.0,
            "total_current": 0.004,
            "total_power": 0.048,
            "component_measurements": [
                {
                    "component_id": "VM1",
                    "type": "voltmeter",
                    "voltage": 8.0,
                    "current": 0.0,
                    "power": 0.0,
                }
            ],
        },
        "graphs": [
            {
                "id": "ohm",
                "type": "iv",
                "title": "Ohm's Law",
                "y_unit": "A",
                "series": [
                    {"name": "I vs V", "point_count": 3, "y_range": {"min": 0.0, "max": 0.004}}
                ],
            }
        ],
        "validation": {"valid": True, "errors": [], "warnings": []},
    }


def test_summarize_circuit_includes_components_nets_and_fingerprint():
    summary = summarize_circuit_definition(DIVIDER)
    assert summary is not None
    ids = {c["id"] for c in summary["components"]}
    assert ids == {"V1", "R1", "R2"}
    assert any(c["properties"].get("resistance") == 2000 for c in summary["components"])
    assert summary["nets"]
    assert summary["fingerprint"]
    changed = summarize_circuit_definition(CHANGED_R2)
    assert changed["fingerprint"] != summary["fingerprint"]


def test_stale_editor_mismatch_drops_measurements():
    run = _run_context("run-old", DIVIDER)
    merged = apply_live_editor_circuit(run, CHANGED_R2)
    assert merged is not None
    assert merged["run_is_stale"] is True
    assert merged["status"] == "stale_editor_mismatch"
    assert "dc_result" not in merged
    assert "measurements" not in merged
    assert merged["editor_circuit"]["components"][-1]["properties"]["resistance"] == 4000


def test_matching_editor_keeps_run_measurements():
    run = _run_context("run-match", DIVIDER)
    merged = apply_live_editor_circuit(run, DIVIDER)
    assert merged is not None
    assert merged.get("run_is_stale") is not True
    assert merged["dc_result"]["node_voltages"]["n2"] == 8.0


def test_simulation_prompt_includes_live_circuit_and_node_voltages():
    builder = PromptBuilder()
    context = ContextResult()
    context.simulation = apply_live_editor_circuit(_run_context("run-div", DIVIDER), DIVIDER)
    prompt = builder.build_prompt(context, "Explain what is happening in my circuit.")
    assert "SIMULATION MENTOR MODE" in prompt
    assert "GENERAL MENTOR MODE" not in prompt
    assert "CURRENT EDITOR CIRCUIT" in prompt
    assert "R2" in prompt
    assert "2000" in prompt
    assert "n2: 8.0 V" in prompt or "n2: 8.0" in prompt
    assert "R1: 0.004 A" in prompt or "0.004" in prompt
    assert "Ohm's Law" in prompt
    assert "Never invent voltage" in prompt or "never invent" in prompt.lower()


def test_editor_only_prompt_does_not_invent_a_run():
    builder = PromptBuilder()
    context = ContextResult()
    context.simulation = apply_live_editor_circuit(None, DIVIDER)
    prompt = builder.build_prompt(context, "What's wrong with my wiring?")
    assert "CURRENT EDITOR CIRCUIT" in prompt
    assert "No matching SimulationRun" in prompt or "editor_only" in prompt
    assert "8.0 V" not in prompt
    assert "SIMULATION MENTOR MODE" in prompt
