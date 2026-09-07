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
    assert "PRE-RUN / EDITOR-ONLY MODE" in prompt
    assert "construction" in prompt.lower() or "next-step" in prompt.lower()


OPEN_CIRCUIT = {
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
            "id": "GND1",
            "type": "ground",
            "label": "GND",
            "properties": {},
            "terminals": [{"id": "GND1.ground", "type": "ground"}],
        },
    ],
    "connections": [
        {"id": "W1", "from": "V1.positive", "to": "R1.A"},
        {"id": "W2", "from": "R1.B", "to": "GND1.ground"},
    ],
}

WRONG_WIRE = {
    "components": [
        *OPEN_CIRCUIT["components"],
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
        {"id": "W1", "from": "V1.positive", "to": "R2.B"},
        {"id": "W2", "from": "R1.A", "to": "R1.B"},
        {"id": "W3", "from": "V1.negative", "to": "GND1.ground"},
    ],
}

BAD_LED_CONNECTION = {
    "components": [
        {
            "id": "V1",
            "type": "voltage_source",
            "properties": {"voltage": 5},
            "terminals": [
                {"id": "V1.positive", "type": "positive"},
                {"id": "V1.negative", "type": "negative"},
            ],
        },
        {
            "id": "LED1",
            "type": "led",
            "properties": {"forwardVoltage": 2},
            "terminals": [
                {"id": "LED1.anode", "type": "anode"},
                {"id": "LED1.cathode", "type": "cathode"},
            ],
        },
        {
            "id": "GND1",
            "type": "ground",
            "properties": {},
            "terminals": [{"id": "GND1.ground", "type": "ground"}],
        },
    ],
    "connections": [
        {"id": "W1", "from": "V1.positive", "to": "LED1.anode"},
        {"id": "W2", "from": "LED1.cathode", "to": "GND1.ground"},
        {"id": "W3", "from": "V1.negative", "to": "GND1.ground"},
    ],
}


def _invalid_run(run_id: str, circuit: dict, error: dict) -> dict:
    summary = summarize_circuit_definition(circuit)
    return {
        "simulation_run_id": run_id,
        "status": "invalid",
        "circuit": summary,
        "authority": "These values come from the EngineerOS simulator.",
        "validation": {
            "valid": False,
            "errors": [error],
            "warnings": [],
        },
    }


def test_scenario_open_circuit_prompt_names_unconnected_return():
    builder = PromptBuilder()
    context = ContextResult()
    error = {
        "code": "OPEN_CIRCUIT",
        "message": "The circuit has an open connection.",
        "affected_terminals": ["V1.negative"],
        "affected_components": ["V1"],
        "suggested_fix": "Connect V1.negative to ground.",
    }
    context.simulation = apply_live_editor_circuit(
        _invalid_run("run-open", OPEN_CIRCUIT, error), OPEN_CIRCUIT
    )
    prompt = builder.build_prompt(context, "Why isn't my circuit working?")
    assert "OPEN_CIRCUIT" in prompt
    assert "V1.negative" in prompt
    assert "Unconnected terminals" in prompt or "Open/unconnected terminals" in prompt
    assert "do not re-solve" in prompt.lower() or "recommend a fix" in prompt.lower()
    summary = summarize_circuit_definition(OPEN_CIRCUIT)
    assert "V1.negative" in summary["unconnected_terminals"]


def test_scenario_wrong_wire_prompt_includes_isolated_r2_and_looped_r1():
    summary = summarize_circuit_definition(WRONG_WIRE)
    assert "R2.A" in summary["unconnected_terminals"]
    assert any(c["from"] == "R1.A" and c["to"] == "R1.B" for c in summary["connections"])
    builder = PromptBuilder()
    context = ContextResult()
    context.simulation = apply_live_editor_circuit(
        _invalid_run(
            "run-wire",
            WRONG_WIRE,
            {
                "code": "INVALID_CONNECTION",
                "message": "R1 terminals are shorted to each other.",
                "affected_components": ["R1"],
                "affected_terminals": ["R1.A", "R1.B"],
                "suggested_fix": "Wire R1 in series with the source, not across itself.",
            },
        ),
        WRONG_WIRE,
    )
    prompt = builder.build_prompt(context, "What's wrong with my circuit and how do I fix it?")
    assert "R1.A" in prompt and "R1.B" in prompt
    assert "R2" in prompt
    assert "INVALID_CONNECTION" in prompt
    assert "Suggested fix" in prompt


def test_scenario_incorrect_component_connection_points_to_led_terminals():
    summary = summarize_circuit_definition(BAD_LED_CONNECTION)
    assert any(
        c["from"] == "V1.positive" and c["to"] == "LED1.anode" for c in summary["connections"]
    )
    builder = PromptBuilder()
    context = ContextResult()
    context.simulation = apply_live_editor_circuit(
        _invalid_run(
            "run-led-wire",
            BAD_LED_CONNECTION,
            {
                "code": "LED_NO_CURRENT_LIMIT",
                "message": "LED connected without current-limiting resistor",
                "affected_components": ["LED1"],
                "affected_terminals": ["LED1.anode", "LED1.cathode"],
                "suggested_fix": "Add a series resistor between the source and LED1.",
            },
        ),
        BAD_LED_CONNECTION,
    )
    prompt = builder.build_prompt(context, "What's wrong with my circuit?")
    assert "LED1" in prompt
    assert "LED_NO_CURRENT_LIMIT" in prompt
    assert "LED1.anode" in prompt


def test_scenario_led_validation_failure_is_from_simulator_not_ai():
    builder = PromptBuilder()
    context = ContextResult()
    context.simulation = apply_live_editor_circuit(
        _invalid_run(
            "run-led",
            BAD_LED_CONNECTION,
            {
                "code": "LED_NO_CURRENT_LIMIT",
                "message": "LED connected without current-limiting resistor",
                "explanation": "LED is connected directly to the source",
                "affected_components": ["LED1"],
                "suggested_fix": "Add a series resistor",
            },
        ),
        BAD_LED_CONNECTION,
    )
    prompt = builder.build_prompt(context, "Why isn't my circuit working?")
    assert "FAILED (by simulator" in prompt
    assert "LED is connected directly to the source" in prompt
    assert "Add a series resistor" in prompt


def test_scenario_incorrect_measurement_uses_run_voltmeter_value():
    builder = PromptBuilder()
    context = ContextResult()
    context.simulation = apply_live_editor_circuit(_run_context("run-vm", DIVIDER), DIVIDER)
    prompt = builder.build_prompt(context, "Why is my voltmeter showing this value?")
    assert "Voltmeter VM1 reading (simulator): 8.0 V" in prompt
    assert "run-vm" in prompt


def test_scenario_correct_circuit_forbids_invented_faults():
    builder = PromptBuilder()
    context = ContextResult()
    context.simulation = apply_live_editor_circuit(_run_context("run-ok", DIVIDER), DIVIDER)
    prompt = builder.build_prompt(context, "What's wrong with my circuit?")
    assert "Validation: PASSED" in prompt
    assert "Do not invent a wiring, component, or measurement problem" in prompt
    assert "code=OPEN_CIRCUIT" not in prompt
    assert "code=LED_NO_CURRENT_LIMIT" not in prompt
    assert "DIAGNOSIS: Validation PASSED" in prompt


EMPTY_CANVAS = {"components": [], "connections": []}

PARTIAL_BUILD = {
    "components": [
        {
            "id": "V1",
            "type": "voltage_source",
            "label": "V1",
            "properties": {"voltage": 5},
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
            "id": "GND1",
            "type": "ground",
            "label": "GND1",
            "properties": {},
            "terminals": [{"id": "GND1.ground", "type": "ground"}],
        },
    ],
    "connections": [
        {"id": "W1", "from": "V1.positive", "to": "R1.A"},
    ],
}


def test_a_empty_editor_does_not_invent_components_or_measurements():
    builder = PromptBuilder()
    context = ContextResult()
    context.simulation = apply_live_editor_circuit(None, EMPTY_CANVAS)
    prompt = builder.build_prompt(context, "How should I build this circuit?")
    assert context.simulation["status"] == "editor_only"
    assert "Canvas is empty" in prompt
    assert "PRE-RUN EDITOR CONTEXT" in prompt
    assert "PRE-RUN / EDITOR-ONLY MODE" in prompt
    assert "8.0 V" not in prompt
    assert "Total Current:" not in prompt
    assert "R2" not in prompt
    assert "Never invent" in prompt or "never invent" in prompt.lower()


def test_b_partial_circuit_lists_real_parts_only():
    builder = PromptBuilder()
    context = ContextResult()
    context.simulation = apply_live_editor_circuit(None, PARTIAL_BUILD)
    prompt = builder.build_prompt(context, "What should I connect next?")
    assert "V1" in prompt and "R1" in prompt and "GND1" in prompt
    assert "V1.positive" in prompt and "R1.A" in prompt
    assert "R2" not in prompt
    assert "PRE-RUN / EDITOR-ONLY MODE" in prompt
    assert "I connected" in prompt
    assert "Do not say" in prompt


def test_c_pre_run_snapshot_supplied_without_measurements():
    builder = PromptBuilder()
    context = ContextResult()
    context.simulation = apply_live_editor_circuit(None, DIVIDER)
    prompt = builder.build_prompt(context, "What is the current?")
    assert "CURRENT EDITOR CIRCUIT" in prompt
    assert "R1" in prompt and "R2" in prompt
    assert "UNKNOWN" in prompt
    assert "8.0 V" not in prompt
    assert "0.004" not in prompt
    assert "AUTHORITATIVE SIMULATION FACTS (from EngineerOS simulator" not in prompt
    assert "No matching SimulationRun" in prompt


def test_d_post_run_diagnosis_still_includes_measurements():
    builder = PromptBuilder()
    context = ContextResult()
    context.simulation = apply_live_editor_circuit(_run_context("run-div", DIVIDER), DIVIDER)
    prompt = builder.build_prompt(context, "Explain what is happening in my circuit.")
    assert "AUTHORITATIVE SIMULATION FACTS" in prompt
    assert "PRE-RUN / EDITOR-ONLY MODE" not in prompt
    assert "0.004" in prompt
    assert "8.0" in prompt
    assert "run-div" in prompt


def test_e_edit_after_run_does_not_keep_stale_measurements():
    builder = PromptBuilder()
    context = ContextResult()
    context.simulation = apply_live_editor_circuit(_run_context("run-old", DIVIDER), CHANGED_R2)
    prompt = builder.build_prompt(context, "What is the current?")
    assert "STALE RUN MODE" in prompt
    assert "4000" in prompt
    assert "dc_result" not in context.simulation
    assert "0.004" not in prompt
    assert "8.0 V" not in prompt


def test_f_invalid_circuit_uses_simulator_error_not_invented_values():
    builder = PromptBuilder()
    context = ContextResult()
    error = {
        "code": "OPEN_CIRCUIT",
        "message": "The circuit has an open connection.",
        "affected_terminals": ["V1.negative"],
        "affected_components": ["V1"],
        "suggested_fix": "Connect V1.negative to ground.",
    }
    context.simulation = apply_live_editor_circuit(
        _invalid_run("run-open", OPEN_CIRCUIT, error), OPEN_CIRCUIT
    )
    prompt = builder.build_prompt(context, "What's wrong with my circuit?")
    assert "OPEN_CIRCUIT" in prompt
    assert "PRE-RUN / EDITOR-ONLY MODE" not in prompt
    assert "Total Current:" not in prompt
    assert "do not re-solve" in prompt.lower() or "recommend a fix" in prompt.lower()


def test_g_current_editor_overrides_old_conversation_values():
    builder = PromptBuilder()
    context = ContextResult()
    context.conversation = [
        {"role": "user", "content": "R2 is 2000 ohm."},
        {"role": "assistant", "content": "Yes, R2 is 2000 Ω on that drawing."},
    ]
    context.simulation = apply_live_editor_circuit(None, CHANGED_R2)
    prompt = builder.build_prompt(context, "What about R2?")
    assert "4000" in prompt
    assert "CURRENT EDITOR CIRCUIT" in prompt
    assert "SIMULATION CONTEXT wins" in prompt


def test_conversation_history_stays_bounded():
    builder = PromptBuilder()
    context = ContextResult()
    context.conversation = [
        {"role": "user", "content": f"turn-{i} " + ("x" * 800)}
        for i in range(15)
    ]
    prompt = builder.build_prompt(context, "Follow up")
    assert "turn-14" in prompt
    assert "turn-0" not in prompt
    assert "..." in prompt
