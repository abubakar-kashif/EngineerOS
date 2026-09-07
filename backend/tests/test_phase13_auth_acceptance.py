"""
Phase 13 — Full authentication acceptance (backend).

Covers the product matrix without rewriting auth:
register → verify → me
wrong / expired codes
resend invalidates the old code
verified login → me → logout → login
password forgot → reset → login
"""

from datetime import datetime, timedelta

from app.core.security import EMAIL_CODE_TTL_SECONDS
from app.models.user import User
from tests.test_auth import bearer, register_user


def test_phase13_new_user_register_verify_me_agrees(phase9_client):
    client, _ = phase9_client
    registered = register_user(client, "p13-new@example.com")
    token = registered["token"]
    assert registered["user"]["email_verified"] is False

    me_before = client.get("/api/auth/me", headers=bearer(token))
    assert me_before.status_code == 200
    assert me_before.json()["user"]["email_verified"] is False

    verify = client.post(
        "/api/auth/verify",
        json={"email": "p13-new@example.com", "code": registered["dev_code"]},
    )
    assert verify.status_code == 200

    me_after = client.get("/api/auth/me", headers=bearer(token))
    assert me_after.status_code == 200
    assert me_after.json()["user"]["email_verified"] is True
    assert me_after.json()["user"]["email"] == "p13-new@example.com"


def test_phase13_wrong_code_rejected(phase9_client):
    client, _ = phase9_client
    registered = register_user(client, "p13-wrong@example.com")
    wrong = "000000" if registered["dev_code"] != "000000" else "111111"
    response = client.post(
        "/api/auth/verify",
        json={"email": "p13-wrong@example.com", "code": wrong},
    )
    assert response.status_code == 400
    assert "invalid or expired" in response.json()["detail"].lower()
    me = client.get("/api/auth/me", headers=bearer(registered["token"]))
    assert me.json()["user"]["email_verified"] is False


def test_phase13_expired_code_rejected(phase9_client):
    client, session_factory = phase9_client
    registered = register_user(client, "p13-expired@example.com")
    with session_factory() as db:
        user = db.query(User).filter(User.email == "p13-expired@example.com").one()
        user.email_code_expires_at = datetime.utcnow() - timedelta(seconds=1)
        db.commit()
    response = client.post(
        "/api/auth/verify",
        json={"email": "p13-expired@example.com", "code": registered["dev_code"]},
    )
    assert response.status_code == 400
    assert "invalid or expired" in response.json()["detail"].lower()


def test_phase13_resend_issues_new_working_code(phase9_client):
    client, session_factory = phase9_client
    registered = register_user(client, "p13-resend@example.com")
    old = registered["dev_code"]
    with session_factory() as db:
        user = db.query(User).filter(User.email == "p13-resend@example.com").one()
        user.email_code_expires_at = datetime.utcnow() + timedelta(
            seconds=EMAIL_CODE_TTL_SECONDS - 70
        )
        db.commit()
    resend = client.post("/api/auth/resend", json={"email": "p13-resend@example.com"})
    assert resend.status_code == 200
    new = resend.json()["dev_code"]
    assert new and new != old
    stale = client.post(
        "/api/auth/verify",
        json={"email": "p13-resend@example.com", "code": old},
    )
    assert stale.status_code == 400
    ok = client.post(
        "/api/auth/verify",
        json={"email": "p13-resend@example.com", "code": new},
    )
    assert ok.status_code == 200


def test_phase13_verified_login_refresh_logout_login(phase9_client):
    client, _ = phase9_client
    register_user(client, "p13-session@example.com", verify=True)

    login = client.post(
        "/api/auth/login",
        json={"email": "p13-session@example.com", "password": "supersecret1"},
    )
    assert login.status_code == 200
    body = login.json()
    assert body["user"]["email_verified"] is True
    assert body.get("dev_code") in (None, "")
    token = body["token"]

    me = client.get("/api/auth/me", headers=bearer(token))
    assert me.status_code == 200
    assert me.json()["user"]["email_verified"] is True

    logout = client.post("/api/auth/logout", headers=bearer(token))
    assert logout.status_code == 200
    assert client.get("/api/auth/me", headers=bearer(token)).status_code == 401

    again = client.post(
        "/api/auth/login",
        json={"email": "p13-session@example.com", "password": "supersecret1"},
    )
    assert again.status_code == 200
    assert again.json()["user"]["email_verified"] is True
    me2 = client.get(
        "/api/auth/me",
        headers=bearer(again.json()["token"]),
    )
    assert me2.json()["user"]["email_verified"] is True


def test_phase13_password_reset_then_login(phase9_client):
    client, _ = phase9_client
    register_user(client, "p13-reset@example.com", verify=True)
    forgot = client.post("/api/auth/forgot", json={"email": "p13-reset@example.com"})
    assert forgot.status_code == 200
    code = forgot.json()["dev_code"]
    reset = client.post(
        "/api/auth/reset",
        json={
            "email": "p13-reset@example.com",
            "token": code,
            "password": "BrandNewPass2!",
        },
    )
    assert reset.status_code == 200
    old = client.post(
        "/api/auth/login",
        json={"email": "p13-reset@example.com", "password": "supersecret1"},
    )
    assert old.status_code == 401
    new = client.post(
        "/api/auth/login",
        json={"email": "p13-reset@example.com", "password": "BrandNewPass2!"},
    )
    assert new.status_code == 200
    assert new.json()["user"]["email_verified"] is True
