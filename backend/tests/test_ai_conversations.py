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
    get_messages,
)

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
        conv = create_conversation(db_session, user_id="user-a", title="Test")
        assert conv.id is not None
        assert conv.user_id == "user-a"
        assert conv.title == "Test"
        assert conv.created_at is not None

    def test_get_conversation(self, db_session):
        """Test getting a conversation."""
        conv = create_conversation(db_session, user_id="user-a", title="Test")
        retrieved = get_conversation(db_session, conv.id, "user-a")
        assert retrieved.id == conv.id

    def test_list_conversations(self, db_session):
        """Test listing conversations."""
        create_conversation(db_session, user_id="user-a", title="Test 1")
        create_conversation(db_session, user_id="user-a", title="Test 2")
        convs, total = list_conversations(db_session, user_id="user-a")
        assert total == 2
        assert len(convs) == 2

    def test_add_message(self, db_session):
        """Test adding a message."""
        conv = create_conversation(db_session, user_id="user-a", title="Test")
        msg = add_message(db_session, conv.id, "user", "Hello", user_id="user-a")
        assert msg.id is not None
        assert msg.role == "user"
        assert msg.content == "Hello"

    def test_get_messages(self, db_session):
        """Test getting messages."""
        conv = create_conversation(db_session, user_id="user-a", title="Test")
        add_message(db_session, conv.id, "user", "Hello", user_id="user-a")
        add_message(db_session, conv.id, "assistant", "Hi there", user_id="user-a")
        msgs, total = get_messages(db_session, conv.id, user_id="user-a")
        assert total == 2
        assert len(msgs) == 2


class TestConversationOwnership:
    """Tests for conversation ownership isolation."""

    def test_user_can_access_own_conversation(self, db_session):
        """Test user can access their own conversation."""
        conv = create_conversation(db_session, user_id="user-a", title="Test")
        retrieved = get_conversation(db_session, conv.id, "user-a")
        assert retrieved.id == conv.id

    def test_user_cannot_access_other_conversation(self, db_session):
        """Test user B cannot access User A's conversation."""
        conv = create_conversation(db_session, user_id="user-a", title="Test")
        with pytest.raises(Exception):
            get_conversation(db_session, conv.id, "user-b")

    def test_list_only_own_conversations(self, db_session):
        """Test user only sees their own conversations."""
        create_conversation(db_session, user_id="user-a", title="A-1")
        create_conversation(db_session, user_id="user-a", title="A-2")
        create_conversation(db_session, user_id="user-b", title="B-1")

        convs_a, total_a = list_conversations(db_session, user_id="user-a")
        convs_b, total_b = list_conversations(db_session, user_id="user-b")

        assert total_a == 2
        assert total_b == 1
        assert all(c.user_id == "user-a" for c in convs_a)
        assert all(c.user_id == "user-b" for c in convs_b)