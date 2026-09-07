"""Email delivery abstraction.

The auth service depends on these helpers instead of a hard-coded mail
provider. The backend is selected via EMAIL_DELIVERY:

* console — explicit development/debug only (writes to the server log)
* smtp    — real mailbox delivery through SMTP_* settings (Gmail, etc.)

Credentials stay backend-only and are never logged or returned to the client.
Register a new EmailSender subclass in _SENDERS to wire another provider.
"""

from __future__ import annotations

import html
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


VERIFICATION_SUBJECT = "Verify your EngineerOS account"
PASSWORD_RESET_SUBJECT = "Reset your EngineerOS password"


class EmailDeliveryError(Exception):
    """Raised when an email cannot be delivered."""


class EmailSender:
    """Delivery backend contract — one subclass per provider."""

    def send(self, to: str, subject: str, body: str, html_body: str | None = None) -> None:
        raise NotImplementedError


class ConsoleSender(EmailSender):
    """Development sender: writes the email to the server log.

    Never used as the production delivery mechanism. Production and any
    EMAIL_DELIVERY=smtp configuration go through SmtpSender instead.
    """

    def send(self, to: str, subject: str, body: str, html_body: str | None = None) -> None:
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


def frontend_public_url() -> str:
    """Public EngineerOS origin for email links. Not a secret."""
    configured = (settings.FRONTEND_URL or "").strip().rstrip("/")
    if configured:
        return configured
    origins = settings.CORS_ORIGINS or []
    if origins:
        first = str(origins[0]).strip().rstrip("/")
        if first:
            return first
    return "http://localhost:5173"


def verification_page_url() -> str:
    return f"{frontend_public_url()}/verify"


def _reply_to_address() -> str:
    return (settings.SMTP_REPLY_TO or "").strip()


def _build_message(
    to: str,
    subject: str,
    body: str,
    html_body: str | None = None,
) -> EmailMessage:
    from_addr = _smtp_from_address()
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = formataddr(("EngineerOS", from_addr))
    message["To"] = to
    message["Date"] = formatdate(localtime=True)
    domain = from_addr.split("@")[-1] if "@" in from_addr else "localhost"
    message["Message-ID"] = make_msgid(domain=domain)
    reply_to = _reply_to_address()
    if reply_to:
        message["Reply-To"] = reply_to
    message.set_content(body)
    if html_body:
        message.add_alternative(html_body, subtype="html")
    return message


class SmtpSender(EmailSender):
    """Production sender: delivers through a configured SMTP server."""

    def send(self, to: str, subject: str, body: str, html_body: str | None = None) -> None:
        require_smtp_settings()
        host = (settings.SMTP_HOST or "").strip()
        message = _build_message(to, subject, body, html_body)

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


def _verification_plain_text(code: str) -> str:
    page = verification_page_url()
    return (
        "Hello,\n\n"
        "Welcome to EngineerOS. You are receiving this email because an account "
        "was created with this address.\n\n"
        "Please verify your EngineerOS account by entering this code on the "
        f"verification page:\n\n{code}\n\n"
        f"Verification page: {page}\n\n"
        "The code expires in 2 minutes. If you did not create this account, "
        "you can safely ignore this email.\n\n"
        "Regards,\n"
        "EngineerOS\n"
    )


def _verification_html(code: str) -> str:
    page = verification_page_url()
    safe_code = html.escape(code)
    safe_page = html.escape(page)
    return (
        "<!DOCTYPE html>"
        '<html lang="en"><head><meta charset="utf-8">'
        f"<title>{html.escape(VERIFICATION_SUBJECT)}</title></head>"
        '<body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.5; color: #111827;">'
        "<p>Hello,</p>"
        "<p>Welcome to EngineerOS. You are receiving this email because an account "
        "was created with this address.</p>"
        "<p>Please verify your EngineerOS account by entering this code on the verification page:</p>"
        f'<p style="font-size: 22px; font-weight: 700; letter-spacing: 0.12em;">{safe_code}</p>'
        f'<p><a href="{safe_page}">Open the EngineerOS verification page</a></p>'
        "<p>The code expires in 2 minutes. If you did not create this account, "
        "you can safely ignore this email.</p>"
        "<p>Regards,<br>EngineerOS</p>"
        "</body></html>"
    )


def build_verification_message(to: str, code: str) -> EmailMessage:
    """MIME message for account verification (plain + HTML, no tracking)."""
    return _build_message(
        to,
        VERIFICATION_SUBJECT,
        _verification_plain_text(code),
        _verification_html(code),
    )


def send_verification_email(to: str, code: str) -> None:
    _sender().send(
        to=to,
        subject=VERIFICATION_SUBJECT,
        body=_verification_plain_text(code),
        html_body=_verification_html(code),
    )


def send_password_reset_email(to: str, code: str) -> None:
    _sender().send(
        to=to,
        subject=PASSWORD_RESET_SUBJECT,
        body=(
            "A password reset was requested for your EngineerOS account.\n\n"
            f"Your reset code is: {code}\n\n"
            "If you did not request this, you can safely ignore this email.\n\n"
            "Regards,\n"
            "EngineerOS\n"
        ),
    )
