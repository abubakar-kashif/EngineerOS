"""Password hashing and token/code generation.

Uses the standard library only (PBKDF2-HMAC-SHA256 with a per-user random
salt and constant-time comparison) so no extra dependency — and no
plaintext password — ever touches the database.
"""

import hashlib
import hmac
import secrets

PBKDF2_ITERATIONS = 260_000
ALGORITHM = "pbkdf2_sha256"

# Bearer sessions live for 7 days; email codes 120s; password reset 30min.
SESSION_TTL_SECONDS = 7 * 24 * 60 * 60
EMAIL_CODE_TTL_SECONDS = 120
EMAIL_RESEND_COOLDOWN_SECONDS = 60
RESET_CODE_TTL_SECONDS = 30 * 60


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), PBKDF2_ITERATIONS
    )
    return f"{ALGORITHM}${PBKDF2_ITERATIONS}${salt}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algorithm, iterations, salt, expected_hex = stored.split("$", 3)
    except (ValueError, AttributeError):
        return False

    if algorithm != ALGORITHM:
        return False

    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), int(iterations)
    )
    return hmac.compare_digest(digest.hex(), expected_hex)


def generate_token() -> str:
    """Opaque bearer token handed to the client (only the hash is stored)."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_code() -> str:
    """6-digit numeric code for email verification / password reset."""
    return f"{secrets.randbelow(1_000_000):06d}"
