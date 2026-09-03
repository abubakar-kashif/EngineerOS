"""
Tests for context modules (Phases 10-17).
"""

import pytest

from app.services.ai.context_engine import ContextEngine, ContextResult


class TestContextEngine:
    """Tests for ContextEngine."""

    def test_context_engine_import(self):
        """Test ContextEngine can be imported."""
        assert ContextEngine is not None

    def test_context_result_empty(self):
        """Test ContextResult empty state."""
        result = ContextResult()
        assert result.is_empty() is True

    def test_context_result_to_dict(self):
        """Test ContextResult to_dict method."""
        result = ContextResult()
        result.current_message = "Hello"
        d = result.to_dict()
        assert "current_message" in d
        assert d["current_message"] == "Hello"

    def test_context_result_to_dict_empty(self):
        """Test ContextResult to_dict with no data."""
        result = ContextResult()
        d = result.to_dict()
        assert d == {}

    def test_context_result_with_experiment(self):
        """Test ContextResult with experiment data."""
        result = ContextResult()
        result.experiment = {"id": "exp-1", "title": "Ohm's Law"}
        assert result.is_empty() is False
        d = result.to_dict()
        assert "experiment" in d
        assert d["experiment"]["title"] == "Ohm's Law"


class TestContextImports:
    """Test that all context modules can be imported."""

    def test_experiment_context_import(self):
        from app.services.ai.context.experiment_context import ExperimentContext
        assert ExperimentContext is not None

    def test_quiz_context_import(self):
        from app.services.ai.context.quiz_context import QuizContext
        assert QuizContext is not None

    def test_report_context_import(self):
        from app.services.ai.context.report_context import ReportContext
        assert ReportContext is not None

    def test_user_context_import(self):
        from app.services.ai.context.user_context import UserContext
        assert UserContext is not None

    def test_conversation_context_import(self):
        from app.services.ai.context.conversation_context import ConversationContext
        assert ConversationContext is not None

    def test_simulation_context_import(self):
        from app.services.ai.context.simulation_context import SimulationContext
        assert SimulationContext is not None