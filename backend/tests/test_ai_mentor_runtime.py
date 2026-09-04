"""Phase 3 runtime-path tests for Mentor ask/stream persistence and config."""

from unittest.mock import Mock, PropertyMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.routes.auth import router as auth_router
from app.api.routes.conversations import router as conversations_router
from app.api.routes.mentor import router as mentor_router
from app.core.config import settings
from app.core.security import hash_password
from app.db.database import Base, get_db
from app.models.conversation import ConversationMessage
from app.models.user import User
from app.services.ai.providers.openai_provider import OpenAIProvider
from app.services.user_service import ensure_preferences


@pytest.fixture()
def mentor_runtime_client(tmp_path):
    db_path = tmp_path / "mentor_runtime.db"
    engine = create_engine(
        f"sqlite:///{db_path}",
        connect_args={"check_same_thread": False},
    )
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
    )
    Base.metadata.create_all(bind=engine)

    with TestingSessionLocal() as db:
        user = User(
            name="Demo User",
            email="demo@engineeros.dev",
            password_hash=hash_password("demo1234"),
            email_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        ensure_preferences(db, user)

    app = FastAPI(title="EngineerOS Mentor Runtime Test API")
    app.include_router(auth_router)
    app.include_router(conversations_router)
    app.include_router(mentor_router)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as client:
        yield client, TestingSessionLocal

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


def _login(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "demo@engineeros.dev", "password": "demo1234"},
    )
    assert response.status_code == 200, response.text
    return response.json()["token"]


def _auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}


def test_stream_without_api_key_errors_and_persists_nothing(mentor_runtime_client):
    client, session_factory = mentor_runtime_client
    token = _login(client)
    created = client.post("/api/conversations", headers=_auth_headers(token), json={})
    assert created.status_code == 201
    conversation_id = created.json()["id"]

    # Ensure the live settings path has no key for this assertion.
    previous = settings.AI_API_KEY
    settings.AI_API_KEY = None
    try:
        response = client.post(
            f"/api/conversations/{conversation_id}/ask/stream",
            headers=_auth_headers(token),
            json={"content": "Explain Ohm's Law."},
        )
    finally:
        settings.AI_API_KEY = previous

    assert response.status_code == 200
    body = response.text
    assert '"type": "error"' in body or '"type":"error"' in body
    assert "API key" in body
    assert '"type": "complete"' not in body and '"type":"complete"' not in body

    with session_factory() as db:
        count = (
            db.query(ConversationMessage)
            .filter(ConversationMessage.conversation_id == conversation_id)
            .count()
        )
    assert count == 0


def test_stream_success_persists_user_and_assistant(mentor_runtime_client):
    client, session_factory = mentor_runtime_client
    token = _login(client)
    created = client.post("/api/conversations", headers=_auth_headers(token), json={})
    conversation_id = created.json()["id"]

    chunk1 = Mock()
    chunk1.choices = [Mock()]
    chunk1.choices[0].delta = Mock(content="Ohm")
    chunk1.choices[0].finish_reason = None
    chunk1.usage = None

    chunk2 = Mock()
    chunk2.choices = [Mock()]
    chunk2.choices[0].delta = Mock(content="'s law is V = IR.")
    chunk2.choices[0].finish_reason = "stop"
    chunk2.usage = None

    mock_client = Mock()
    mock_client.chat.completions.create.return_value = iter([chunk1, chunk2])

    with patch.object(
        OpenAIProvider, "client", new_callable=PropertyMock
    ) as client_prop:
        client_prop.return_value = mock_client
        response = client.post(
            f"/api/conversations/{conversation_id}/ask/stream",
            headers=_auth_headers(token),
            json={"content": "Explain Ohm's Law."},
        )

    assert response.status_code == 200
    assert "delta" in response.text
    assert "complete" in response.text

    detail = client.get(
        f"/api/conversations/{conversation_id}",
        headers=_auth_headers(token),
    ).json()
    roles = [m["role"] for m in detail["messages"]]
    assert roles == ["user", "assistant"]
    assert detail["messages"][0]["content"] == "Explain Ohm's Law."
    assert "V = IR" in detail["messages"][1]["content"]


def test_regenerate_skips_duplicate_user_turn(mentor_runtime_client):
    client, _session_factory = mentor_runtime_client
    token = _login(client)
    created = client.post("/api/conversations", headers=_auth_headers(token), json={})
    conversation_id = created.json()["id"]

    def _stream_chunks(text: str):
        chunk = Mock()
        chunk.choices = [Mock()]
        chunk.choices[0].delta = Mock(content=text)
        chunk.choices[0].finish_reason = "stop"
        chunk.usage = None
        return iter([chunk])

    mock_client = Mock()
    mock_client.chat.completions.create.side_effect = [
        _stream_chunks("First answer"),
        _stream_chunks("Second answer"),
    ]

    with patch.object(
        OpenAIProvider, "client", new_callable=PropertyMock
    ) as client_prop:
        client_prop.return_value = mock_client
        first = client.post(
            f"/api/conversations/{conversation_id}/ask/stream",
            headers=_auth_headers(token),
            json={"content": "Explain Voltage Divider.", "persist_user": True},
        )
        assert first.status_code == 200
        second = client.post(
            f"/api/conversations/{conversation_id}/ask/stream",
            headers=_auth_headers(token),
            json={"content": "Explain Voltage Divider.", "persist_user": False},
        )
        assert second.status_code == 200

    detail = client.get(
        f"/api/conversations/{conversation_id}",
        headers=_auth_headers(token),
    ).json()
    roles = [m["role"] for m in detail["messages"]]
    assert roles == ["user", "assistant", "assistant"]
    assert detail["messages"][0]["content"] == "Explain Voltage Divider."
