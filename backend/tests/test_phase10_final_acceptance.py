"""
Phase 10 — Final acceptance gate (backend).

Auth: register → verify → me stays verified → logout → login (no re-verify)
Password reset: forgot → reset → login
Mentor: LED_NO_CURRENT_LIMIT appears in grounded prompt (explain, don't invent)
"""

from unittest.mock import MagicMock, PropertyMock, patch

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
from app.models.user import User
from app.services.ai.context_engine import ContextResult
from app.services.ai.prompt_builder import PromptBuilder
from app.services.ai.providers.openai_provider import OpenAIProvider
from app.services.user_service import ensure_preferences


@pytest.fixture()
def phase10_client(tmp_path):
    db_path = tmp_path / "phase10.db"
    engine = create_engine(
        f"sqlite:///{db_path}",
        connect_args={"check_same_thread": False},
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    app = FastAPI(title="EngineerOS Phase 10")
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


def _register(client, email: str, password: str = "AcceptGate1!"):
    response = client.post(
        "/api/auth/register",
        json={"name": "Phase Ten", "email": email, "password": password},
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_auth_register_verify_refresh_logout_login(phase10_client):
    client, _ = phase10_client
    previous_debug = settings.DEBUG
    previous_delivery = settings.EMAIL_DELIVERY
    settings.DEBUG = True
    settings.EMAIL_DELIVERY = "console"
    try:
        registered = _register(client, "phase10-auth@example.com")
        assert registered["user"]["email_verified"] is False
        code = registered["dev_code"]
        assert isinstance(code, str) and len(code) == 6

        verify = client.post(
            "/api/auth/verify",
            json={"email": "phase10-auth@example.com", "code": code},
        )
        assert verify.status_code == 200

        token = registered["token"]
        me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me.status_code == 200
        assert me.json()["user"]["email_verified"] is True

        logout = client.post(
            "/api/auth/logout",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert logout.status_code == 200

        login = client.post(
            "/api/auth/login",
            json={"email": "phase10-auth@example.com", "password": "AcceptGate1!"},
        )
        assert login.status_code == 200
        body = login.json()
        assert body["user"]["email_verified"] is True
        # Verified users must not be forced through verification again
        assert body.get("dev_code") in (None, "")
        assert "verify" not in (body.get("next") or "")
    finally:
        settings.DEBUG = previous_debug
        settings.EMAIL_DELIVERY = previous_delivery


def test_password_reset_flow(phase10_client):
    client, _ = phase10_client
    previous_debug = settings.DEBUG
    previous_delivery = settings.EMAIL_DELIVERY
    settings.DEBUG = True
    settings.EMAIL_DELIVERY = "console"
    try:
        registered = _register(client, "phase10-reset@example.com")
        client.post(
            "/api/auth/verify",
            json={
                "email": "phase10-reset@example.com",
                "code": registered["dev_code"],
            },
        )

        forgot = client.post(
            "/api/auth/forgot",
            json={"email": "phase10-reset@example.com"},
        )
        assert forgot.status_code == 200
        reset_code = forgot.json()["dev_code"]
        assert isinstance(reset_code, str) and len(reset_code) == 6

        reset = client.post(
            "/api/auth/reset",
            json={
                "email": "phase10-reset@example.com",
                "token": reset_code,
                "password": "BrandNewPass2!",
            },
        )
        assert reset.status_code == 200

        old = client.post(
            "/api/auth/login",
            json={"email": "phase10-reset@example.com", "password": "AcceptGate1!"},
        )
        assert old.status_code == 401

        new = client.post(
            "/api/auth/login",
            json={"email": "phase10-reset@example.com", "password": "BrandNewPass2!"},
        )
        assert new.status_code == 200
        assert new.json()["user"]["email_verified"] is True
    finally:
        settings.DEBUG = previous_debug
        settings.EMAIL_DELIVERY = previous_delivery


def test_mentor_prompt_explains_led_error_from_simulator():
    context = ContextResult()
    context.simulation = {
        "simulation_run_id": "run-phase10-led",
        "status": "invalid",
        "authority": "Authoritative simulator values.",
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
    prompt = PromptBuilder().build_prompt(
        context,
        "Why did my simulation fail?",
    )
    assert "LED_NO_CURRENT_LIMIT" in prompt
    assert "AUTHORITATIVE SIMULATION FACTS" in prompt
    assert "do not recalculate" in prompt.lower() or "Do not calculate" in prompt
    assert "Add a series resistor" in prompt


def test_mentor_stream_uses_fresh_simulation_context(phase10_client):
    """Ask/stream path persists assistant text from provider — not a simulated reply."""
    client, session_factory = phase10_client

    with session_factory() as db:
        user = User(
            name="Mentor User",
            email="phase10-mentor@example.com",
            password_hash=hash_password("AcceptGate1!"),
            email_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        ensure_preferences(db, user)

    login = client.post(
        "/api/auth/login",
        json={"email": "phase10-mentor@example.com", "password": "AcceptGate1!"},
    )
    token = login.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    created = client.post("/api/conversations", headers=headers, json={})
    conversation_id = created.json()["id"]

    chunk = MagicMock()
    chunk.choices = [MagicMock()]
    chunk.choices[0].delta = MagicMock(
        content="Your LED has no current-limiting resistor, so the validator reports LED_NO_CURRENT_LIMIT."
    )
    chunk.choices[0].finish_reason = "stop"
    chunk.usage = None

    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = iter([chunk])

    with patch.object(OpenAIProvider, "client", new_callable=PropertyMock) as client_prop:
        client_prop.return_value = mock_client
        response = client.post(
            f"/api/conversations/{conversation_id}/ask/stream",
            headers=headers,
            json={
                "content": "What went wrong with my LED?",
                "simulation_id": None,
            },
        )

    assert response.status_code == 200
    assert "LED_NO_CURRENT_LIMIT" in response.text
    assert "buildSimulatedReply" not in response.text
