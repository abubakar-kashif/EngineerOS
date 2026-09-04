"""Phase 9 authentication tests.

Covers registration, login, bearer sessions (/auth/me), logout, email
verification, password reset, and unauthenticated access to protected
endpoints. Each test runs against an isolated database (phase9_client).
"""

import logging
from datetime import datetime, timedelta

from app.models.user import SessionToken, User
from app.services.email_service import (
    send_password_reset_email,
    send_verification_email,
)


def register_user(client, email, name="Ada Lovelace", password="supersecret1", *, verify=False):
    """Register a user. Pass verify=True to mark email verified (needed for login)."""
    response = client.post(
        "/api/auth/register",
        json={"name": name, "email": email, "password": password},
    )
    assert response.status_code == 201
    data = response.json()
    if verify:
        code = data.get("dev_code")
        assert isinstance(code, str)
        verified = client.post(
            "/api/auth/verify",
            json={"email": email, "code": code},
        )
        assert verified.status_code == 200
        data["user"]["email_verified"] = True
    return data


def bearer(token):
    return {"Authorization": f"Bearer {token}"}


# --- Registration -----------------------------------------------------------


def test_register_creates_account(phase9_client):
    client, _ = phase9_client

    data = register_user(client, "new@example.com")

    assert data["token"]
    assert data["user"]["email"] == "new@example.com"
    assert data["user"]["name"] == "Ada Lovelace"
    assert data["user"]["email_verified"] is False
    assert "password_hash" not in data["user"]
    # Preferences and the live session are part of the response.
    assert data["user"]["preferences"]["theme"] == "dark"
    assert any(session["current"] for session in data["user"]["sessions"])
    # DEBUG builds expose the verification code (no mail server in dev).
    assert isinstance(data["dev_code"], str)
    assert len(data["dev_code"]) == 6


def test_register_stores_password_hash_not_plaintext(phase9_client):
    client, session_factory = phase9_client

    register_user(client, "hash@example.com")

    with session_factory() as db:
        user = db.query(User).filter(User.email == "hash@example.com").one()
        assert user.password_hash != "supersecret1"
        assert user.password_hash.startswith("pbkdf2_sha256$")


def test_register_duplicate_email_conflicts(phase9_client):
    client, _ = phase9_client
    register_user(client, "dup@example.com")

    response = client.post(
        "/api/auth/register",
        json={
            "name": "Someone Else",
            "email": "dup@example.com",
            "password": "supersecret1",
        },
    )

    assert response.status_code == 409


def test_register_short_password_rejected(phase9_client):
    client, _ = phase9_client

    response = client.post(
        "/api/auth/register",
        json={"name": "Short", "email": "short@example.com", "password": "short"},
    )

    assert response.status_code == 422


def test_register_invalid_email_rejected(phase9_client):
    client, _ = phase9_client

    response = client.post(
        "/api/auth/register",
        json={"name": "Bad", "email": "not-an-email", "password": "supersecret1"},
    )

    assert response.status_code == 422


# --- Login -------------------------------------------------------------------


def test_login_returns_new_session(phase9_client):
    client, _ = phase9_client
    registered = register_user(client, "login@example.com", verify=True)

    response = client.post(
        "/api/auth/login",
        json={"email": "login@example.com", "password": "supersecret1"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["token"]
    assert data["token"] != registered["token"]
    assert data["user"]["id"] == registered["user"]["id"]


def test_login_email_is_case_insensitive(phase9_client):
    client, _ = phase9_client
    register_user(client, "case@example.com", verify=True)

    response = client.post(
        "/api/auth/login",
        json={"email": "CASE@Example.COM", "password": "supersecret1"},
    )

    assert response.status_code == 200


def test_login_wrong_password_rejected(phase9_client):
    client, _ = phase9_client
    register_user(client, "wrongpw@example.com", verify=True)

    response = client.post(
        "/api/auth/login",
        json={"email": "wrongpw@example.com", "password": "incorrect1"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password."


def test_login_unknown_email_gives_same_error_as_wrong_password(phase9_client):
    client, _ = phase9_client
    register_user(client, "known@example.com", verify=True)

    wrong_password = client.post(
        "/api/auth/login",
        json={"email": "known@example.com", "password": "incorrect1"},
    )
    unknown_email = client.post(
        "/api/auth/login",
        json={"email": "ghost@example.com", "password": "irrelevant1"},
    )

    assert wrong_password.status_code == unknown_email.status_code == 401
    assert wrong_password.json()["detail"] == unknown_email.json()["detail"]


def test_login_rejects_unverified_email(phase9_client):
    client, _ = phase9_client
    register_user(client, "unverified@example.com", verify=False)

    response = client.post(
        "/api/auth/login",
        json={"email": "unverified@example.com", "password": "supersecret1"},
    )

    assert response.status_code == 403
    assert "verify your email" in response.json()["detail"].lower()


# --- /auth/me and sessions ----------------------------------------------------


def test_me_requires_authentication(phase9_client):
    client, _ = phase9_client

    response = client.get("/api/auth/me")

    assert response.status_code == 401


def test_me_rejects_invalid_token(phase9_client):
    client, _ = phase9_client

    response = client.get("/api/auth/me", headers=bearer("not-a-real-token"))

    assert response.status_code == 401
    assert response.json()["detail"] == "Session expired or invalid"


def test_me_returns_current_user(phase9_client):
    client, _ = phase9_client
    registered = register_user(client, "me@example.com")

    response = client.get("/api/auth/me", headers=bearer(registered["token"]))

    assert response.status_code == 200
    data = response.json()
    assert data["user"]["id"] == registered["user"]["id"]
    assert data["user"]["email"] == "me@example.com"
    assert data["user"]["preferences"]["theme"] == "dark"
    assert any(session["current"] for session in data["user"]["sessions"])


def test_expired_session_rejected(phase9_client):
    client, session_factory = phase9_client
    registered = register_user(client, "expired@example.com")

    with session_factory() as db:
        db.query(SessionToken).filter(
            SessionToken.user_id == registered["user"]["id"]
        ).update({"expires_at": datetime.utcnow() - timedelta(seconds=1)})
        db.commit()

    response = client.get("/api/auth/me", headers=bearer(registered["token"]))

    assert response.status_code == 401


def test_logout_revokes_session(phase9_client):
    client, _ = phase9_client
    registered = register_user(client, "bye@example.com")

    response = client.post("/api/auth/logout", headers=bearer(registered["token"]))

    assert response.status_code == 200
    assert response.json()["message"] == "Signed out successfully."
    # The revoked token no longer authenticates.
    assert (
        client.get("/api/auth/me", headers=bearer(registered["token"])).status_code
        == 401
    )


def test_logout_requires_authentication(phase9_client):
    client, _ = phase9_client

    response = client.post("/api/auth/logout")

    assert response.status_code == 401


# --- Email verification -------------------------------------------------------


def test_verify_email_with_dev_code(phase9_client):
    client, _ = phase9_client
    registered = register_user(client, "verify@example.com")

    response = client.post(
        "/api/auth/verify",
        json={"email": "verify@example.com", "code": registered["dev_code"]},
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Email verified successfully."

    me = client.get("/api/auth/me", headers=bearer(registered["token"]))
    assert me.json()["user"]["email_verified"] is True


def test_verify_rejects_wrong_code(phase9_client):
    client, _ = phase9_client
    registered = register_user(client, "wrongcode@example.com")
    wrong_code = "000000" if registered["dev_code"] != "000000" else "000001"

    response = client.post(
        "/api/auth/verify",
        json={"email": "wrongcode@example.com", "code": wrong_code},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid or expired verification code."


def test_verify_unknown_email(phase9_client):
    client, _ = phase9_client

    response = client.post(
        "/api/auth/verify",
        json={"email": "ghost@example.com", "code": "123456"},
    )

    assert response.status_code == 404


def test_resend_verification_issues_new_code(phase9_client):
    client, session_factory = phase9_client
    registered = register_user(client, "resend@example.com")
    old_code = registered["dev_code"]

    # Expire the resend cooldown (server enforces EMAIL_RESEND_COOLDOWN_SECONDS).
    from app.core.security import EMAIL_CODE_TTL_SECONDS

    with session_factory() as db:
        user = db.query(User).filter(User.email == "resend@example.com").one()
        user.email_code_expires_at = datetime.utcnow() + timedelta(
            seconds=EMAIL_CODE_TTL_SECONDS - 70
        )
        db.commit()

    response = client.post("/api/auth/resend", json={"email": "resend@example.com"})

    assert response.status_code == 200
    assert response.json()["message"] == "Verification code sent."
    new_code = response.json()["dev_code"]
    assert isinstance(new_code, str)
    assert new_code != old_code

    # Old code must no longer work after resend invalidation.
    stale = client.post(
        "/api/auth/verify",
        json={"email": "resend@example.com", "code": old_code},
    )
    assert stale.status_code == 400

    verify = client.post(
        "/api/auth/verify",
        json={"email": "resend@example.com", "code": new_code},
    )
    assert verify.status_code == 200


def test_resend_cooldown_enforced(phase9_client):
    client, _ = phase9_client
    register_user(client, "cooldown@example.com")

    response = client.post("/api/auth/resend", json={"email": "cooldown@example.com"})
    assert response.status_code == 429


def test_verify_rejects_expired_code(phase9_client):
    client, session_factory = phase9_client
    registered = register_user(client, "expire@example.com")

    with session_factory() as db:
        user = db.query(User).filter(User.email == "expire@example.com").one()
        user.email_code_expires_at = datetime.utcnow() - timedelta(seconds=1)
        db.commit()

    response = client.post(
        "/api/auth/verify",
        json={"email": "expire@example.com", "code": registered["dev_code"]},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid or expired verification code."


def test_resend_after_verification_conflicts(phase9_client):
    client, _ = phase9_client
    registered = register_user(client, "already@example.com")
    client.post(
        "/api/auth/verify",
        json={"email": "already@example.com", "code": registered["dev_code"]},
    )

    response = client.post("/api/auth/resend", json={"email": "already@example.com"})

    assert response.status_code == 409


def test_email_delivery_uses_the_configured_sender(caplog):
    with caplog.at_level(logging.INFO, logger="engineeros.email"):
        send_verification_email("dev@example.com", "123456")
        send_password_reset_email("dev@example.com", "654321")

    # The default EMAIL_DELIVERY ("console") writes emails to the server log.
    assert "dev@example.com" in caplog.text
    assert "123456" in caplog.text
    assert "654321" in caplog.text


# --- Password reset -----------------------------------------------------------


def test_forgot_password_does_not_reveal_account_existence(phase9_client):
    client, _ = phase9_client
    register_user(client, "exists@example.com")

    known = client.post("/api/auth/forgot", json={"email": "exists@example.com"})
    unknown = client.post("/api/auth/forgot", json={"email": "ghost@example.com"})

    assert known.status_code == unknown.status_code == 200
    assert known.json()["message"] == unknown.json()["message"]
    # Only the real account receives a reset code in DEBUG builds.
    assert isinstance(known.json()["dev_code"], str)
    assert unknown.json()["dev_code"] is None


def test_reset_password_rotates_password_and_revokes_sessions(phase9_client):
    client, _ = phase9_client
    registered = register_user(client, "reset@example.com", verify=True)

    # A second session that must also be revoked by the reset.
    second = client.post(
        "/api/auth/login",
        json={"email": "reset@example.com", "password": "supersecret1"},
    )
    assert second.status_code == 200

    reset_code = client.post(
        "/api/auth/forgot", json={"email": "reset@example.com"}
    ).json()["dev_code"]

    response = client.post(
        "/api/auth/reset",
        json={
            "token": reset_code,
            "password": "brand-new-password",
            "email": "reset@example.com",
        },
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Password has been reset successfully."

    # Every pre-reset session is revoked...
    assert (
        client.get("/api/auth/me", headers=bearer(registered["token"])).status_code
        == 401
    )
    assert (
        client.get("/api/auth/me", headers=bearer(second.json()["token"])).status_code
        == 401
    )

    # ...the new password signs in, the old one no longer does.
    assert (
        client.post(
            "/api/auth/login",
            json={"email": "reset@example.com", "password": "brand-new-password"},
        ).status_code
        == 200
    )
    assert (
        client.post(
            "/api/auth/login",
            json={"email": "reset@example.com", "password": "supersecret1"},
        ).status_code
        == 401
    )


def test_reset_rejects_invalid_code(phase9_client):
    client, _ = phase9_client
    register_user(client, "badreset@example.com")

    response = client.post(
        "/api/auth/reset",
        json={"token": "999999", "password": "brand-new-password"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid or expired reset code."


def test_reset_rejects_expired_code(phase9_client):
    client, session_factory = phase9_client
    register_user(client, "expired-reset@example.com", verify=True)
    reset_code = client.post(
        "/api/auth/forgot", json={"email": "expired-reset@example.com"}
    ).json()["dev_code"]

    with session_factory() as db:
        user = db.query(User).filter(User.email == "expired-reset@example.com").one()
        user.reset_code_expires_at = datetime.utcnow() - timedelta(seconds=1)
        db.commit()

    response = client.post(
        "/api/auth/reset",
        json={
            "token": reset_code,
            "password": "brand-new-password",
            "email": "expired-reset@example.com",
        },
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid or expired reset code."


def test_reset_rejects_reused_code(phase9_client):
    client, _ = phase9_client
    register_user(client, "reuse-reset@example.com", verify=True)
    reset_code = client.post(
        "/api/auth/forgot", json={"email": "reuse-reset@example.com"}
    ).json()["dev_code"]

    first = client.post(
        "/api/auth/reset",
        json={
            "token": reset_code,
            "password": "brand-new-password",
            "email": "reuse-reset@example.com",
        },
    )
    assert first.status_code == 200

    reuse = client.post(
        "/api/auth/reset",
        json={
            "token": reset_code,
            "password": "another-new-password",
            "email": "reuse-reset@example.com",
        },
    )
    assert reuse.status_code == 400
    assert reuse.json()["detail"] == "Invalid or expired reset code."


def test_smtp_sender_requires_configuration():
    from app.services.email_service import EmailDeliveryError, SmtpSender

    sender = SmtpSender()
    try:
        sender.send("to@example.com", "Subject", "Body")
        raise AssertionError("expected EmailDeliveryError")
    except EmailDeliveryError as exc:
        assert "SMTP" in str(exc)


# --- Unauthenticated access to protected endpoints -----------------------------


def test_protected_endpoints_require_authentication(phase9_client):
    client, _ = phase9_client

    for url in (
        "/api/users/me",
        "/api/users/me/preferences",
        "/api/notifications",
        "/api/conversations",
        "/api/progress/me",
    ):
        assert client.get(url).status_code == 401, f"GET {url} should require auth"

    assert client.post("/api/conversations", json={}).status_code == 401
