"""
Tests for MentorService (Phase 9, with PromptBuilder Phase 18).
"""

import pytest
from unittest.mock import Mock, patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.services.ai.mentor_service import MentorService
from app.services.ai.prompt_builder import PromptBuilder
from app.services.ai.types import AIRequest, AIMessage


SQLALCHEMY_DATABASE_URL = "sqlite:///./test_ai.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


class TestMentorService:
    """Tests for MentorService."""

    def test_mentor_service_import(self):
        assert MentorService is not None

    def test_mentor_service_init(self, db_session):
        service = MentorService(db_session)
        assert service.db is not None
        assert service.provider is not None
        assert service.protection is not None
        assert service.prompt_builder is not None

    def test_start_conversation(self, db_session):
        service = MentorService(db_session)
        conv = service.start_conversation(user_id="user-a", title="Test")
        assert conv.id is not None
        assert conv.title == "Test"
        # Verify ownership by querying the Conversation model directly
        from app.models import Conversation
        conv_model = db_session.query(Conversation).filter(Conversation.id == conv.id).first()
        assert conv_model is not None
        assert conv_model.user_id == "user-a"

    def test_start_conversation_default_title(self, db_session):
        service = MentorService(db_session)
        conv = service.start_conversation(user_id="user-a")
        assert conv.title == "AI Mentor Session"


class TestPromptBuilder:
    """Tests for PromptBuilder."""

    def test_prompt_builder_import(self):
        assert PromptBuilder is not None

    def test_prompt_builder_init(self):
        builder = PromptBuilder()
        assert builder.SYSTEM_INSTRUCTIONS is not None
        assert builder.ENGINEEROS_RULES is not None

    def test_prompt_builder_build_prompt_minimal(self, db_session):
        from app.services.ai.context_engine import ContextResult
        builder = PromptBuilder()
        context = ContextResult()
        context.current_message = "What is Ohm's law?"
        prompt = builder.build_prompt(context, "What is Ohm's law?")
        assert "EngineerOS Mentor" in prompt
        assert "GROUNDING RULES" in prompt
        assert "Ohm's law" in prompt
        assert "GENERAL MENTOR MODE" in prompt
        assert "simulation is NOT required" in prompt
        assert "Do not say that you cannot answer because a simulation is missing" in prompt

    def test_general_mentor_messages_include_user_turn(self, db_session):
        from app.services.ai.context_engine import ContextResult
        builder = PromptBuilder()
        context = ContextResult()
        messages = builder.build_messages(context, "What is Kirchhoff's Current Law?")
        assert len(messages) == 2
        assert messages[0].role == "system"
        assert messages[1].role == "user"
        assert messages[1].content == "What is Kirchhoff's Current Law?"
        assert "GENERAL MENTOR MODE" in messages[0].content
        assert "SIMULATION CONTEXT (authoritative simulator facts)" not in messages[0].content

    def test_simulation_prompt_does_not_enter_general_mode(self, db_session):
        from app.services.ai.context_engine import ContextResult
        builder = PromptBuilder()
        context = ContextResult()
        context.simulation = {
            "simulation_run_id": "run-1",
            "status": "completed",
            "dc_result": {"success": True, "total_current": 0.01},
        }
        prompt = builder.build_prompt(context, "Explain these measurements.")
        assert "GENERAL MENTOR MODE" not in prompt
        assert "run-1" in prompt

    def test_prompt_builder_build_prompt_with_context(self, db_session):
        from app.services.ai.context_engine import ContextResult
        builder = PromptBuilder()
        context = ContextResult()
        context.experiment = {"title": "Ohm's Law", "difficulty": "Beginner"}
        context.current_message = "Explain this"
        prompt = builder.build_prompt(context, "Explain this")
        assert "Ohm's Law" in prompt
        assert "Beginner" in prompt