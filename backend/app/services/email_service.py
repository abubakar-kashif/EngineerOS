"""Email delivery abstraction (Phase 2 §4.2).

The auth service depends on these helpers instead of a hard-coded mail
provider. The backend is selected via the EMAIL_DELIVERY setting, so
development (console logging) and production (a real provider) stay
separably configurable — register a new EmailSender subclass in _SENDERS
to wire a provider up.
"""

import logging

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


class EmailSender:
    """Delivery backend contract — one subclass per provider."""

    def send(self, to: str, subject: str, body: str) -> None:
        raise NotImplementedError


class ConsoleSender(EmailSender):
    """Development sender: writes the email to the server log."""

    def send(self, to: str, subject: str, body: str) -> None:
        logger.info("EMAIL to=%s subject=%s\n%s", to, subject, body)


_SENDERS: dict[str, type[EmailSender]] = {
    "console": ConsoleSender,
}


def _sender() -> EmailSender:
    sender_cls = _SENDERS.get(settings.EMAIL_DELIVERY)
    if sender_cls is None:
        # Unknown provider falls back to console so mail is never silently lost.
        logger.warning(
            "Unknown EMAIL_DELIVERY %r — using the console sender.",
            settings.EMAIL_DELIVERY,
        )
        sender_cls = ConsoleSender
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
