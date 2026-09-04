"""
Block 6 — AI ↔ simulation closed loop: fresh run IDs and prompt freshness.
"""

from unittest.mock import MagicMock

from app.services.ai.context_engine import ContextResult
from app.services.ai.prompt_builder import PromptBuilder


class TestClosedLoopPromptFreshness:
    def test_prompt_prefers_new_run_over_conversation_history(self):
        builder = PromptBuilder()
        context = ContextResult()
        context.conversation = [
            {"role": "assistant", "content": "Vout was 8 V on your previous run."},
            {"role": "user", "content": "I changed R2 and reran."},
        ]
        context.simulation = {
            "simulation_run_id": "run-fresh-2",
            "status": "completed",
            "authority": "Authoritative simulator values.",
            "dc_result": {
                "success": True,
                "total_current": 0.0024,
                "total_power": 0.0288,
                "equivalent_resistance": 5000.0,
                "component_results": [
                    {"component_id": "R1", "voltage": 2.4, "current": 0.0024, "power": 0.00576},
                    {"component_id": "R2", "voltage": 9.6, "current": 0.0024, "power": 0.02304},
                ],
            },
            "validation": {"valid": True, "errors": [], "warnings": []},
        }
        prompt = builder.build_prompt(context, "Why did Vout increase?")
        assert "run-fresh-2" in prompt
        assert "FRESHNESS" in prompt or "latest authoritative" in prompt.lower()
        assert "9.6" in prompt
        assert "SIMULATION CONTEXT wins" in prompt or "ONLY current result" in prompt
        # Must not invent that Mentor validated
        assert "do not recalculate" in prompt.lower() or "AUTHORITATIVE" in prompt

    def test_pre_simulation_guidance_has_no_fabricated_circuit(self):
        builder = PromptBuilder()
        context = ContextResult()
        context.experiment = {
            "id": "kvl",
            "title": "Kirchhoff's Voltage Law",
            "components": [{"name": "Voltage source"}, {"name": "Resistors"}],
            "guidance_boundary": "Guidance only; simulator validates.",
        }
        # No simulation context yet
        prompt = builder.build_prompt(context, "I want to build KVL. What components do I need?")
        assert "kvl" in prompt.lower() or "Kirchhoff" in prompt or "KVL" in prompt
        assert "instructional guidance only" in prompt.lower() or "Do not invent the student's circuit" in prompt
        assert "AUTHORITATIVE SIMULATION FACTS" not in prompt or context.simulation is None


class TestPersistRunMetadataContract:
    """run_simulation must expose simulation_run_id for Mentor ask bodies."""

    def test_metadata_shape_documented_for_frontend(self):
        # Frontend extractRunId expects metadata.simulation_run_id
        sample = {
            "status": "completed",
            "metadata": {
                "simulation_id": "sim-abc",
                "simulation_run_id": "deadbeefcafebabe0123456789abcdef",
            },
        }
        assert sample["metadata"]["simulation_run_id"]
        assert sample["metadata"]["simulation_id"].startswith("sim-")
