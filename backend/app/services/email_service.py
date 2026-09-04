"""Email delivery abstraction.

The auth service depends on these helpers instead of a hard-coded mail
provider. The backend is selected via EMAIL_DELIVERY:

* console — development (writes to the server log)
* smtp    — production SMTP (requires SMTP_* settings)

Credentials stay backend-only. Register a new EmailSender subclass in
_SENDERS to wire another provider.
"""

from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage

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
    """Development sender: writes the email to the server log."""

    def send(self, to: str, subject: str, body: str) -> None:
        logger.info("EMAIL to=%s subject=%s\n%s", to, subject, body)


class SmtpSender(EmailSender):
    """Production sender: delivers through a configured SMTP server."""

    def send(self, to: str, subject: str, body: str) -> None:
        host = (settings.SMTP_HOST or "").strip()
        from_addr = (settings.SMTP_FROM or settings.SMTP_USERNAME or "").strip()
        if not host or not from_addr:
            raise EmailDeliveryError(
                "SMTP is selected but SMTP_HOST / SMTP_FROM are not configured."
            )

        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = from_addr
        message["To"] = to
        message.set_content(body)

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

        logger.info("EMAIL delivered via SMTP to=%s subject=%s", to, subject)

    @staticmethod
    def _authenticate(smtp: smtplib.SMTP) -> None:
        username = (settings.SMTP_USERNAME or "").strip()
        password = settings.SMTP_PASSWORD or ""
        if username:
            smtp.login(username, password)


_SENDERS: dict[str, type[EmailSender]] = {
    "console": ConsoleSender,
    "smtp": SmtpSender,
}


def _sender() -> EmailSender:
    """Resolve the configured delivery backend.

    Console delivery is explicit-only. Unknown values raise in production
    (DEBUG=false) so codes are never silently logged; in DEBUG they fall
    back to console with a warning for local development convenience.
    """
    key = (settings.EMAIL_DELIVERY or "").strip().lower()
    if not key:
        key = "console" if settings.DEBUG else "smtp"

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
        logger.warning(
            "EMAIL_DELIVERY=console while DEBUG=false — codes will appear in "
            "server logs. Prefer EMAIL_DELIVERY=smtp in production."
        )
    return sender_cls()


def send_verification_email(to: str, code: str) -> None:
    _sender().send(
        to=to,
        subject="Verify your EngineerOS account",
        body=(
            "Welcome to EngineerOS!\n\n"
            f"Your verification code is: {code}\n\n"
            "Enter it on the verification screen to activate your account. "
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
