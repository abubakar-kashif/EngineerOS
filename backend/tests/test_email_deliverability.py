"""Verification email MIME, copy, and production delivery rules."""

from email.message import EmailMessage

from app.core.config import settings
from app.services.email_service import (
    VERIFICATION_SUBJECT,
    build_verification_message,
    frontend_public_url,
    send_verification_email,
    verification_page_url,
)


def _plain(message: EmailMessage) -> str:
    part = message.get_body(preferencelist=("plain",))
    assert part is not None
    return part.get_content()


def _html(message: EmailMessage) -> str:
    part = message.get_body(preferencelist=("html",))
    assert part is not None
    return part.get_content()


def test_verification_subject_and_recipient():
    message = build_verification_message("student@example.com", "246810")
    assert message["Subject"] == VERIFICATION_SUBJECT
    assert "Verify your EngineerOS account" in message["Subject"]
    assert message["To"] == "student@example.com"
    assert "EngineerOS" in str(message["From"])
    assert message["Date"]
    assert message["Message-ID"]


def test_verification_sender_uses_configured_from():
    previous = settings.SMTP_FROM
    settings.SMTP_FROM = "noreply@engineeros.example"
    try:
        message = build_verification_message("student@example.com", "246810")
        assert "noreply@engineeros.example" in str(message["From"])
    finally:
        settings.SMTP_FROM = previous


def test_verification_plain_text_contains_page_not_smtp_password():
    previous = (settings.FRONTEND_URL, settings.SMTP_PASSWORD)
    settings.FRONTEND_URL = "http://localhost:5173"
    settings.SMTP_PASSWORD = "super-secret-smtp"
    try:
        message = build_verification_message("student@example.com", "246810")
        text = _plain(message)
        assert "246810" in text
        assert "http://localhost:5173/verify" in text
        assert "EngineerOS" in text
        assert "ignore" in text.lower()
        assert "super-secret-smtp" not in text
        assert "SMTP_PASSWORD" not in text
    finally:
        settings.FRONTEND_URL, settings.SMTP_PASSWORD = previous


def test_verification_html_is_simple_and_has_link():
    previous = settings.FRONTEND_URL
    settings.FRONTEND_URL = "https://app.example.test"
    try:
        message = build_verification_message("student@example.com", "246810")
        html_body = _html(message)
        assert "<a href=" in html_body
        assert "https://app.example.test/verify" in html_body
        assert "<script" not in html_body.lower()
        assert "tracking" not in html_body.lower()
        assert "<img" not in html_body.lower()
        assert "super-secret-smtp" not in html_body
    finally:
        settings.FRONTEND_URL = previous


def test_verification_message_is_multipart_alternative():
    message = build_verification_message("student@example.com", "246810")
    assert message.get_content_type() == "multipart/alternative"
    types = {part.get_content_type() for part in message.iter_parts()}
    assert "text/plain" in types
    assert "text/html" in types


def test_reply_to_only_when_configured():
    previous = settings.SMTP_REPLY_TO
    settings.SMTP_REPLY_TO = ""
    try:
        without = build_verification_message("student@example.com", "246810")
        assert without["Reply-To"] is None
    finally:
        settings.SMTP_REPLY_TO = previous

    settings.SMTP_REPLY_TO = "support@engineeros.example"
    try:
        with_reply = build_verification_message("student@example.com", "246810")
        assert with_reply["Reply-To"] == "support@engineeros.example"
    finally:
        settings.SMTP_REPLY_TO = previous


def test_frontend_url_falls_back_to_cors_or_localhost():
    previous = settings.FRONTEND_URL
    settings.FRONTEND_URL = ""
    try:
        assert frontend_public_url()
        assert verification_page_url().endswith("/verify")
        assert "smtp" not in verification_page_url().lower()
    finally:
        settings.FRONTEND_URL = previous


def test_console_verification_logs_plain_body(caplog):
    import logging

    with caplog.at_level(logging.INFO, logger="engineeros.email"):
        send_verification_email("dev@example.com", "135791")
    assert "dev@example.com" in caplog.text
    assert VERIFICATION_SUBJECT in caplog.text
    assert "135791" in caplog.text
    assert "<script" not in caplog.text


def test_console_delivery_rejected_when_debug_false():
    from app.services.email_service import EmailDeliveryError, _sender

    previous_debug = settings.DEBUG
    previous_delivery = settings.EMAIL_DELIVERY
    settings.DEBUG = False
    settings.EMAIL_DELIVERY = "console"
    try:
        try:
            _sender()
            raise AssertionError("expected EmailDeliveryError")
        except EmailDeliveryError as exc:
            assert "not allowed when DEBUG=false" in str(exc)
    finally:
        settings.DEBUG = previous_debug
        settings.EMAIL_DELIVERY = previous_delivery
