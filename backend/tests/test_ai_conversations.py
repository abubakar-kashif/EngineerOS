"""
Tests for conversation system (Phases 2-4).
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base, get_db
from app.main import app
from app.services.conversation_service import (
    create_conversation,
    get_conversation,
    list_conversations,
    add_message,
    list_messages,
)
from app.schemas.conversation import ConversationCreateRequest, MessageCreateRequest

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


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


class TestConversations:
    """Tests for conversation CRUD operations."""

    def test_create_conversation(self, db_session):
        """Test creating a conversation."""
        payload = ConversationCreateRequest(title="Test", experiment_id=None)
        conv = create_conversation(db_session, user_id="user-a", payload=payload)
        assert conv.id is not None
        assert conv.title == "Test"
        assert conv.created_at is not None

    def test_get_conversation(self, db_session):
        """Test getting a conversation."""
        payload = ConversationCreateRequest(title="Test", experiment_id=None)
        conv = create_conversation(db_session, user_id="user-a", payload=payload)
        retrieved = get_conversation(db_session, user_id="user-a", conversation_id=conv.id)
        assert retrieved.id == conv.id

    def test_list_conversations(self, db_session):
        """Test listing conversations."""
        payload1 = ConversationCreateRequest(title="Test 1", experiment_id=None)
        payload2 = ConversationCreateRequest(title="Test 2", experiment_id=None)
        create_conversation(db_session, user_id="user-a", payload=payload1)
        create_conversation(db_session, user_id="user-a", payload=payload2)
        convs = list_conversations(db_session, user_id="user-a")
        assert len(convs) == 2

    def test_add_message(self, db_session):
        """Test adding a message."""
        payload = ConversationCreateRequest(title="Test", experiment_id=None)
        conv = create_conversation(db_session, user_id="user-a", payload=payload)
        msg_payload = MessageCreateRequest(role="user", content="Hello")
        msg = add_message(db_session, user_id="user-a", conversation_id=conv.id, payload=msg_payload)
        assert msg.id is not None
        assert msg.role == "user"
        assert msg.content == "Hello"

    def test_get_messages(self, db_session):
        """Test getting messages."""
        payload = ConversationCreateRequest(title="Test", experiment_id=None)
        conv = create_conversation(db_session, user_id="user-a", payload=payload)
        msg1 = MessageCreateRequest(role="user", content="Hello")
        msg2 = MessageCreateRequest(role="assistant", content="Hi there")
        add_message(db_session, user_id="user-a", conversation_id=conv.id, payload=msg1)
        add_message(db_session, user_id="user-a", conversation_id=conv.id, payload=msg2)
        msgs = list_messages(db_session, user_id="user-a", conversation_id=conv.id)
        assert len(msgs) == 2


class TestConversationOwnership:
    """Tests for conversation ownership isolation."""

    def test_user_can_access_own_conversation(self, db_session):
        """Test user can access their own conversation."""
        payload = ConversationCreateRequest(title="Test", experiment_id=None)
        conv = create_conversation(db_session, user_id="user-a", payload=payload)
        retrieved = get_conversation(db_session, user_id="user-a", conversation_id=conv.id)
        assert retrieved.id == conv.id

    def test_user_cannot_access_other_conversation(self, db_session):
        """Test user B cannot access User A's conversation."""
        payload = ConversationCreateRequest(title="Test", experiment_id=None)
        conv = create_conversation(db_session, user_id="user-a", payload=payload)
        with pytest.raises(Exception):
            get_conversation(db_session, user_id="user-b", conversation_id=conv.id)

    def test_list_only_own_conversations(self, db_session):
        """Test user only sees their own conversations."""
        payload_a1 = ConversationCreateRequest(title="A-1", experiment_id=None)
        payload_a2 = ConversationCreateRequest(title="A-2", experiment_id=None)
        payload_b1 = ConversationCreateRequest(title="B-1", experiment_id=None)
        create_conversation(db_session, user_id="user-a", payload=payload_a1)
        create_conversation(db_session, user_id="user-a", payload=payload_a2)
        create_conversation(db_session, user_id="user-b", payload=payload_b1)

        convs_a = list_conversations(db_session, user_id="user-a")
        convs_b = list_conversations(db_session, user_id="user-b")

        assert len(convs_a) == 2
        assert len(convs_b) == 1
        # Note: The service returns ConversationSummaryResponse objects; they don't have user_id directly.
        # Instead, we rely on the fact that we called list_conversations with specific user_id.
        # We can check that the items are of the right type.
        assert all(c.title.startswith("A-") for c in convs_a)
        assert all(c.title.startswith("B-") for c in convs_b)