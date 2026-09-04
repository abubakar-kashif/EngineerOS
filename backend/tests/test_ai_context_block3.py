"""
Block 3 — AI context, ownership, freshness, and prompt grounding tests.
"""

from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from app.schemas.quiz import QuizQuestionResponse
from app.services.ai.context_engine import ContextEngine, ContextResult
from app.services.ai.context.quiz_context import QuizContext
from app.services.ai.context.simulation_context import (
    SimulationContext,
    parse_simulation_result_dict,
)
from app.services.ai.context.simulation_contract import (
    ErrorCode,
    SimulationStatus,
)
from app.services.ai.context.user_context import UserContext
from app.services.ai.prompt_builder import PromptBuilder


class TestParseSimulationResultDict:
    """CamelCase / snake_case parsing without inventing values."""

    def test_parses_led_error_camel_case(self):
        raw = {
            "status": "invalid",
            "validation": {
                "valid": False,
                "errors": [
                    {
                        "code": "LED_NO_CURRENT_LIMIT",
                        "severity": "error",
                        "message": "LED connected without current-limiting resistor",
                        "explanation": "LED is connected directly to the source",
                        "affectedComponents": ["LED1"],
                        "suggestedFix": "Add a series resistor",
                    }
                ],
                "warnings": [],
            },
        }
        result = parse_simulation_result_dict(raw)
        assert result is not None
        assert result.status == SimulationStatus.INVALID
        assert result.validation is not None
        assert result.validation.valid is False
        assert result.validation.errors[0].code == ErrorCode.LED_NO_CURRENT_LIMIT
        assert result.validation.errors[0].affected_components == ["LED1"]

    def test_parses_voltage_divider_dc_result(self):
        raw = {
            "status": "completed",
            "validation": {"valid": True, "errors": [], "warnings": []},
            "dcResult": {
                "success": True,
                "totalCurrent": 0.004,
                "totalPower": 0.048,
                "equivalentResistance": 3000.0,
                "nodeVoltages": {"n1": 12.0, "n2": 8.0},
                "branchCurrents": {},
                "componentResults": {
                    "R1": {
                        "componentId": "R1",
                        "voltage": 4.0,
                        "current": 0.004,
                        "power": 0.016,
                        "resistance": 1000,
                    },
                    "R2": {
                        "componentId": "R2",
                        "voltage": 8.0,
                        "current": 0.004,
                        "power": 0.032,
                        "resistance": 2000,
                    },
                },
            },
            "measurements": {
                "totalVoltage": 12.0,
                "totalCurrent": 0.004,
                "totalPower": 0.048,
                "equivalentResistance": 3000.0,
                "componentMeasurements": [],
            },
        }
        result = parse_simulation_result_dict(raw)
        assert result is not None
        assert result.status == SimulationStatus.COMPLETED
        assert result.dc_result is not None
        assert result.dc_result.total_current == 0.004
        assert result.dc_result.component_results["R2"].voltage == 8.0

    def test_rejects_payload_without_status(self):
        assert parse_simulation_result_dict({"dcResult": {}}) is None


class TestSimulationContextOwnership:
    def test_load_requires_user_id(self):
        db = MagicMock()
        ctx = SimulationContext(db)
        assert ctx.load("sim-1", user_id=None) is None
        db.query.assert_not_called()

    def test_load_returns_none_for_other_users_run(self):
        db = MagicMock()
        query = MagicMock()
        db.query.return_value = query
        query.filter.return_value = query
        query.first.return_value = None
        ctx = SimulationContext(db)
        assert ctx.load("sim-1", user_id="user-a") is None

    def test_to_context_includes_structured_error_and_run_id(self):
        db = MagicMock()
        ctx = SimulationContext(db)

        run = MagicMock()
        run.id = "run-abc"
        run.user_id = "user-a"
        run.experiment_id = "led-circuit"
        run.status = "invalid"
        run.created_at = None
        run.updated_at = None
        run.validation_errors = None
        run.results = {
            "status": "invalid",
            "validation": {
                "valid": False,
                "errors": [
                    {
                        "code": "LED_NO_CURRENT_LIMIT",
                        "severity": "error",
                        "message": "LED connected without current-limiting resistor",
                        "suggestedFix": "Add a series resistor",
                    }
                ],
                "warnings": [],
            },
        }

        query = MagicMock()
        db.query.return_value = query
        query.filter.return_value = query
        query.first.return_value = run

        context = ctx.load("run-abc", user_id="user-a")
        assert context is not None
        assert context["simulation_run_id"] == "run-abc"
        assert context["status"] == "invalid"
        assert context["validation"]["errors"][0]["code"] == "LED_NO_CURRENT_LIMIT"
        assert "authority" in context


class TestUserContextFreshUser:
    def test_fresh_user_has_empty_activity(self):
        db = MagicMock()
        query = MagicMock()
        db.query.return_value = query
        query.filter.return_value = query
        query.order_by.return_value = query
        query.all.return_value = []

        ctx = UserContext(db)
        result = ctx.load("fresh-user")
        assert result["has_activity"] is False
        assert result["completed_experiments"] == 0
        assert result["recent_learning"] == []
        assert result["completed_experiments_list"] == []

    def test_load_filters_by_user_id(self):
        db = MagicMock()
        query = MagicMock()
        db.query.return_value = query
        query.filter.return_value = query
        query.order_by.return_value = query
        query.all.return_value = []

        UserContext(db).load("user-owned")
        assert query.filter.called


class TestPromptGrounding:
    def test_prompt_separates_guidance_and_authoritative_facts(self):
        builder = PromptBuilder()
        context = ContextResult()
        context.experiment = {
            "id": "kvl",
            "title": "KVL",
            "objective": "Verify Kirchhoff's Voltage Law",
            "theory": "Sum of voltages around a loop is zero",
            "components": [{"name": "Voltage source"}, {"name": "Resistors"}],
            "current_stage": "details",
            "guidance_boundary": "Guidance only; simulator validates.",
        }
        context.simulation = {
            "simulation_run_id": "run-1",
            "status": "completed",
            "authority": "Authoritative simulator values.",
            "dc_result": {
                "success": True,
                "total_current": 0.004,
                "total_power": 0.048,
                "equivalent_resistance": 3000.0,
                "component_results": [
                    {"component_id": "R1", "voltage": 4.0, "current": 0.004, "power": 0.016},
                    {"component_id": "R2", "voltage": 8.0, "current": 0.004, "power": 0.032},
                ],
            },
            "validation": {"valid": True, "errors": [], "warnings": []},
        }
        context.current_message = "Why is Vout 8 V?"

        prompt = builder.build_prompt(context, "Why is Vout 8 V?")
        assert "AUTHORITATIVE SIMULATION FACTS" in prompt
        assert "run-1" in prompt
        assert "8.0" in prompt or "8" in prompt
        assert "KVL" in prompt
        assert "Guidance only" in prompt
        assert "YOU MUST FOLLOW THESE" in prompt

    def test_prompt_includes_led_error_from_simulator(self):
        builder = PromptBuilder()
        context = ContextResult()
        context.simulation = {
            "simulation_run_id": "run-led",
            "status": "invalid",
            "validation": {
                "valid": False,
                "errors": [
                    {
                        "code": "LED_NO_CURRENT_LIMIT",
                        "message": "LED connected without current-limiting resistor",
                        "suggested_fix": "Add a series resistor",
                    }
                ],
            },
        }
        prompt = builder.build_prompt(context, "Why did my simulation fail?")
        assert "LED_NO_CURRENT_LIMIT" in prompt
        assert "FAILED (by simulator" in prompt
        assert "Add a series resistor" in prompt


class TestQuizContextNoExplanationCrash:
    """
    QuizQuestionResponse intentionally omits explanation.
    QuizContext must load ORM rows so ContextEngine does not AttributeError.
    """

    def test_student_schema_has_no_explanation_attribute(self):
        response_q = QuizQuestionResponse(
            id=1,
            experiment_id="ohms-law",
            question="What is Ohm's law?",
            option_a="V=IR",
            option_b="P=VI",
            option_c="Q=CV",
            option_d="F=ma",
        )
        with pytest.raises(AttributeError):
            _ = response_q.explanation

    def test_load_uses_orm_and_omits_answer_key(self):
        orm_q = SimpleNamespace(
            id=1,
            experiment_id="ohms-law",
            question="What is Ohm's law?",
            option_a="V=IR",
            option_b="P=VI",
            option_c="Q=CV",
            option_d="F=ma",
            correct_answer="A",
            explanation="Voltage equals current times resistance.",
        )
        db = MagicMock()
        execute_result = MagicMock()
        execute_result.scalars.return_value.all.return_value = [orm_q]
        db.execute.return_value = execute_result

        data = QuizContext(db).load("ohms-law")
        assert data is not None
        assert data["total_questions"] == 1
        assert data["questions"][0]["question"] == "What is Ohm's law?"
        assert "correct_answer" not in data["questions"][0]
        assert "explanation" not in data["questions"][0]

    def test_load_with_result_includes_official_explanation_in_prompt(self):
        orm_q = SimpleNamespace(
            id=7,
            experiment_id="ohms-law",
            question="What is Ohm's law?",
            option_a="V=IR",
            option_b="P=VI",
            option_c="Q=CV",
            option_d="F=ma",
            correct_answer="A",
            explanation="Voltage equals current times resistance.",
        )
        db = MagicMock()
        execute_result = MagicMock()
        execute_result.scalars.return_value.all.return_value = [orm_q]
        db.execute.return_value = execute_result

        data = QuizContext(db).load_with_result(
            "ohms-law",
            question_id=7,
            student_answer="B",
            is_correct=False,
            score=0.0,
        )
        assert data["is_correct"] is False
        assert data["questions"][0]["explanation"] == (
            "Voltage equals current times resistance."
        )
        assert "correct_answer" not in data["questions"][0]

        context = ContextResult()
        context.quiz = data
        prompt = PromptBuilder().build_prompt(context, "Why was I wrong?")
        assert "Official explanation" in prompt
        assert "Voltage equals current times resistance." in prompt
        assert "Official correctness (from quiz system" in prompt

    def test_context_engine_loads_quiz_without_crashing(self):
        orm_q = SimpleNamespace(
            id=1,
            experiment_id="led-circuit",
            question="Why limit LED current?",
            option_a="Protect the LED",
            option_b="Increase brightness always",
            option_c="Store charge",
            option_d="Raise voltage",
            correct_answer="A",
            explanation="Series R limits I.",
        )
        db = MagicMock()
        execute_result = MagicMock()
        execute_result.scalars.return_value.all.return_value = [orm_q]
        db.execute.return_value = execute_result

        engine = ContextEngine(db)
        engine._experiment_context.load = MagicMock(return_value={"id": "led-circuit"})
        engine._report_context.load = MagicMock(return_value=None)
        engine._report_context.load_for_experiment = MagicMock(return_value=None)
        engine._user_context.load = MagicMock(return_value=None)
        engine._conversation_context.load_with_current_question = MagicMock(
            return_value={"recent_messages": []}
        )

        result = engine.gather_context(
            user_id="u1",
            conversation_id="c1",
            question="Help with the quiz",
            experiment_id="led-circuit",
        )
        assert result.quiz is not None
        assert result.quiz["total_questions"] == 1
        assert "explanation" not in result.quiz["questions"][0]


class TestContextEngineFreshnessAndOwnership:
    def test_simulation_ignored_without_user(self):
        db = MagicMock()
        engine = ContextEngine(db)
        engine._experiment_context.load = MagicMock(return_value=None)
        engine._quiz_context.load = MagicMock(return_value=None)
        engine._report_context.load = MagicMock(return_value=None)
        engine._report_context.load_for_experiment = MagicMock(return_value=None)
        engine._user_context.load = MagicMock(return_value=None)
        engine._conversation_context.load_with_current_question = MagicMock(
            return_value={"recent_messages": []}
        )
        engine._simulation_context.load = MagicMock(return_value={"status": "completed"})

        result = engine.gather_context(
            user_id=None,
            conversation_id="c1",
            question="Why?",
            simulation_id="sim-1",
        )
        assert result.simulation is None
        engine._simulation_context.load.assert_not_called()

    def test_fresh_gather_has_no_fabricated_simulation(self):
        db = MagicMock()
        engine = ContextEngine(db)
        engine._experiment_context.load = MagicMock(return_value=None)
        engine._quiz_context.load = MagicMock(return_value=None)
        engine._report_context.load = MagicMock(return_value=None)
        engine._report_context.load_for_experiment = MagicMock(return_value=None)
        engine._user_context.load = MagicMock(
            return_value={
                "has_activity": False,
                "completed_experiments": 0,
                "recent_learning": [],
            }
        )
        engine._conversation_context.load_with_current_question = MagicMock(
            return_value={"recent_messages": []}
        )

        result = engine.gather_context(
            user_id="fresh",
            conversation_id="c1",
            question="Help me build KVL",
        )
        assert result.simulation is None
        assert result.report is None
        assert result.user["has_activity"] is False
        assert result.conversation == []
