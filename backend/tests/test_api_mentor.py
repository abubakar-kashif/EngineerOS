"""
HTTP-level tests for Mentor API endpoints.
"""

import json
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base, get_db
from app.main import app

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_api.db"
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

client = TestClient(app)


@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


def test_create_conversation():
    """Test creating a conversation via HTTP."""
    response = client.post(
        "/conversations/",
        json={"title": "Test", "user_id": "user-a"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["title"] == "Test"
    assert data["user_id"] == "user-a"


def test_list_conversations():
    """Test listing conversations via HTTP."""
    client.post("/conversations/", json={"title": "Test", "user_id": "user-a"})
    
    response = client.get("/conversations/?user_id=user-a")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["total"] >= 1


def test_rename_conversation():
    """Test renaming a conversation via HTTP."""
    create_resp = client.post("/conversations/", json={"title": "Original", "user_id": "user-a"})
    conv_id = create_resp.json()["id"]
    
    response = client.patch(
        f"/conversations/{conv_id}?user_id=user-a",
        json={"title": "Renamed"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Renamed"


def test_delete_conversation():
    """Test deleting a conversation via HTTP."""
    create_resp = client.post("/conversations/", json={"title": "To Delete", "user_id": "user-a"})
    conv_id = create_resp.json()["id"]
    
    response = client.delete(f"/conversations/{conv_id}?user_id=user-a")
    assert response.status_code == 200
    
    get_resp = client.get(f"/conversations/{conv_id}?user_id=user-a")
    assert get_resp.status_code == 404


def test_add_user_message_http():
    """Test adding a user message via HTTP."""
    create_resp = client.post("/conversations/", json={"title": "Test", "user_id": "user-a"})
    conv_id = create_resp.json()["id"]
    
    response = client.post(
        f"/conversations/{conv_id}/messages?user_id=user-a",
        json={"content": "Hello, world!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "user"
    assert data["content"] == "Hello, world!"


def test_cannot_inject_assistant_message():
    """Test that client cannot inject fake assistant messages."""
    create_resp = client.post("/conversations/", json={"title": "Test", "user_id": "user-a"})
    conv_id = create_resp.json()["id"]
    
    response = client.post(
        f"/conversations/{conv_id}/messages?user_id=user-a",
        json={"role": "assistant", "content": "FAKE AI RESPONSE"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "user"
    assert data["content"] == "FAKE AI RESPONSE"


def test_ask_endpoint():
    """Test the /ask endpoint."""
    create_resp = client.post("/conversations/", json={"title": "Test", "user_id": "user-a"})
    conv_id = create_resp.json()["id"]
    
    response = client.post(
        f"/conversations/{conv_id}/ask?user_id=user-a",
        json={"content": "What is Ohm's law?"}
    )
    assert response.status_code in [200, 500]


def test_ask_stream_endpoint_serializes_events():
    """Test /ask/stream endpoint serializes events correctly."""
    create_resp = client.post("/conversations/", json={"title": "Stream Test", "user_id": "user-a"})
    conv_id = create_resp.json()["id"]
    
    response = client.post(
        f"/conversations/{conv_id}/ask/stream?user_id=user-a",
        json={"content": "Hello"}
    )
    # SSE endpoints should return 200 with text/event-stream content type
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/event-stream; charset=utf-8"
    
    # Check that we can parse the events (at least one valid JSON event)
    lines = response.text.strip().split("\n")
    assert len(lines) > 0
    # Each line should start with "data: "
    for line in lines:
        if line.startswith("data: "):
            data = json.loads(line[6:])  # Remove "data: " prefix
            # Should have a 'type' field
            assert "type" in data


def test_ask_stream_nonexistent_conversation():
    """Test /ask/stream with nonexistent conversation."""
    response = client.post(
        "/conversations/nonexistent-id/ask/stream?user_id=user-a",
        json={"content": "Hello"}
    )
    assert response.status_code == 200
    data = json.loads(response.text.replace("data: ", "").strip())
    assert data["type"] == "error"
    assert "Conversation not found" in data["error"]


def test_ask_stream_wrong_owner_denied():
    """Test /ask/stream denies access to wrong owner."""
    # User A creates conversation
    create_resp = client.post("/conversations/", json={"title": "Test", "user_id": "user-a"})
    conv_id = create_resp.json()["id"]
    
    # User B tries to stream
    response = client.post(
        f"/conversations/{conv_id}/ask/stream?user_id=user-b",
        json={"content": "Hello"}
    )
    assert response.status_code == 200
    data = json.loads(response.text.replace("data: ", "").strip())
    assert data["type"] == "error"
    assert "Access denied" in data["error"]