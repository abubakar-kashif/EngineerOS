"""Email delivery abstraction.

The auth service depends on these helpers instead of a hard-coded mail
provider. The backend is selected via EMAIL_DELIVERY:

* console — explicit development/debug only (writes to the server log)
* smtp    — real mailbox delivery through SMTP_* settings (Gmail, etc.)

Credentials stay backend-only and are never logged or returned to the client.
Register a new EmailSender subclass in _SENDERS to wire another provider.
"""

from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage
from email.utils import formataddr, formatdate, make_msgid

from app.core.config import settings

logger = logging.getLogger("engineeros.email")

# Uvicorn's default logging leaves the root logger at WARNING, which would
# silently swallow console delivery — give this logger its own handler so
# development emails are always visible. Records still propagate, so pytest's
# caplog (root-attached) keeps capturing them.
if not logger.handlers:
    _console = logging.StreamHandler()
    _console.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(_console)
    logger.setLevel(logging.INFO)


class EmailDeliveryError(Exception):
    """Raised when an email cannot be delivered."""


class EmailSender:
    """Delivery backend contract — one subclass per provider."""

    def send(self, to: str, subject: str, body: str) -> None:
        raise NotImplementedError


class ConsoleSender(EmailSender):
    """Development sender: writes the email to the server log.

    Never used as the production delivery mechanism. Production and any
    EMAIL_DELIVERY=smtp configuration go through SmtpSender instead.
    """

    def send(self, to: str, subject: str, body: str) -> None:
        logger.info("EMAIL to=%s subject=%s\n%s", to, subject, body)


def _smtp_password() -> str:
    # Gmail App Passwords are often copied with spaces (xxxx xxxx xxxx xxxx).
    return (settings.SMTP_PASSWORD or "").replace(" ", "")


def _smtp_from_address() -> str:
    return (settings.SMTP_FROM or settings.SMTP_USERNAME or "").strip()


def require_smtp_settings() -> None:
    """Fail fast when SMTP delivery is selected but not configured."""
    host = (settings.SMTP_HOST or "").strip()
    from_addr = _smtp_from_address()
    username = (settings.SMTP_USERNAME or "").strip()
    password = _smtp_password()
    if not host or not from_addr:
        raise EmailDeliveryError(
            "SMTP is selected but SMTP_HOST / SMTP_FROM are not configured."
        )
    if "gmail.com" in host.lower() and (not username or not password):
        raise EmailDeliveryError(
            "Gmail SMTP requires SMTP_USERNAME and SMTP_PASSWORD "
            "(use a Google App Password, not the account login password)."
        )
    if username and not password:
        raise EmailDeliveryError(
            "SMTP_USERNAME is set but SMTP_PASSWORD is missing."
        )


def _build_message(to: str, subject: str, body: str) -> EmailMessage:
    from_addr = _smtp_from_address()
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = formataddr(("EngineerOS", from_addr))
    message["To"] = to
    message["Date"] = formatdate(localtime=True)
    message["Message-ID"] = make_msgid(domain=from_addr.split("@")[-1])
    message.set_content(body)
    return message


class SmtpSender(EmailSender):
    """Production sender: delivers through a configured SMTP server."""

    def send(self, to: str, subject: str, body: str) -> None:
        require_smtp_settings()
        host = (settings.SMTP_HOST or "").strip()
        message = _build_message(to, subject, body)

        try:
            if settings.SMTP_USE_SSL:
                with smtplib.SMTP_SSL(host, settings.SMTP_PORT, timeout=30) as smtp:
                    self._authenticate(smtp)
                    smtp.send_message(message)
            else:
                with smtplib.SMTP(host, settings.SMTP_PORT, timeout=30) as smtp:
                    smtp.ehlo()
                    if settings.SMTP_USE_TLS:
                        smtp.starttls()
                        smtp.ehlo()
                    self._authenticate(smtp)
                    smtp.send_message(message)
        except EmailDeliveryError:
            raise
        except Exception as exc:  # noqa: BLE001 — surface any SMTP failure uniformly
            logger.exception("SMTP delivery failed for %s", to)
            raise EmailDeliveryError("Unable to deliver email via SMTP.") from exc

        # Never log the message body (it contains verification / reset codes).
        logger.info("EMAIL delivered via SMTP to=%s subject=%s", to, subject)

    @staticmethod
    def _authenticate(smtp: smtplib.SMTP) -> None:
        username = (settings.SMTP_USERNAME or "").strip()
        password = _smtp_password()
        if username:
            smtp.login(username, password)


_SENDERS: dict[str, type[EmailSender]] = {
    "console": ConsoleSender,
    "smtp": SmtpSender,
}


def delivery_mode() -> str:
    """Resolved delivery backend name: 'console' or 'smtp'."""
    key = (settings.EMAIL_DELIVERY or "").strip().lower()
    if not key:
        key = "console" if settings.DEBUG else "smtp"
    return key


def is_console_delivery() -> bool:
    return delivery_mode() == "console"


def _sender() -> EmailSender:
    """Resolve the configured delivery backend.

    Console delivery is explicit-only. Unknown values raise in production
    (DEBUG=false) so codes are never silently logged; in DEBUG they fall
    back to console with a warning for local development convenience.
    """
    key = delivery_mode()

    sender_cls = _SENDERS.get(key)
    if sender_cls is None:
        if settings.DEBUG:
            logger.warning(
                "Unknown EMAIL_DELIVERY %r — using the console sender (DEBUG only).",
                settings.EMAIL_DELIVERY,
            )
            sender_cls = ConsoleSender
        else:
            raise EmailDeliveryError(
                f"Unknown EMAIL_DELIVERY {settings.EMAIL_DELIVERY!r}. "
                "Set EMAIL_DELIVERY=smtp for production."
            )
    if key == "console" and not settings.DEBUG:
        raise EmailDeliveryError(
            "EMAIL_DELIVERY=console is not allowed when DEBUG=false. "
            "Set EMAIL_DELIVERY=smtp so verification codes go to the mailbox, "
            "not the server log."
        )
    if key == "smtp":
        require_smtp_settings()
    return sender_cls()


def send_verification_email(to: str, code: str) -> None:
    _sender().send(
        to=to,
        subject="Verify your EngineerOS account",
        body=(
            "Welcome to EngineerOS!\n\n"
            f"Your verification code is: {code}\n\n"
            "Enter it on the verification screen to activate your account. "
            "This code expires in 2 minutes. "
            "If you did not create an account, you can ignore this email."
        ),
    )


def send_password_reset_email(to: str, code: str) -> None:
    _sender().send(
        to=to,
        subject="Reset your EngineerOS password",
        body=(
            "A password reset was requested for your EngineerOS account.\n\n"
            f"Your reset code is: {code}\n\n"
            "If you did not request this, you can safely ignore this email."
        ),
    )
