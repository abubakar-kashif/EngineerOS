"""Authentication domain logic: accounts, sessions, verification, resets."""

from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    EMAIL_CODE_TTL_SECONDS,
    EMAIL_RESEND_COOLDOWN_SECONDS,
    RESET_CODE_TTL_SECONDS,
    SESSION_TTL_SECONDS,
    generate_code,
    generate_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.user import SessionToken, User
from app.schemas.auth import RegisterRequest
from app.services import email_service
from app.services import notification_service
from app.services import user_service


def get_user_by_email(db: Session, email: str) -> User | None:
    return (
        db.execute(select(User).where(User.email == email.strip().lower()))
        .scalars()
        .one_or_none()
    )


def create_user(db: Session, payload: RegisterRequest) -> tuple[User, str]:
    """Register a new account. Returns (user, email verification code)."""
    if get_user_by_email(db, payload.email) is not None:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        email_verified=False,
    )
    db.add(user)
    db.flush()  # assign user.id before creating related rows

    code = issue_email_code(db, user)
    email_service.send_verification_email(user.email, code)

    user_service.ensure_preferences(db, user)
    notification_service.create_notification(
        db,
        user_id=user.id,
        type="welcome",
        title="Welcome to EngineerOS!",
        message="Explore experiments, run simulations, and track your progress.",
    )
    db.refresh(user)

    return user, code


def authenticate(db: Session, email: str, password: str) -> User:
    user = get_user_by_email(db, email)

    # Same error for unknown email and wrong password (no account enumeration).
    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    return user


def issue_token(db: Session, user: User, user_agent: str | None = None) -> str:
    token = generate_token()
    db.add(
        SessionToken(
            user_id=user.id,
            token_hash=hash_token(token),
            user_agent=user_agent[:500] if user_agent else None,
            expires_at=datetime.utcnow() + timedelta(seconds=SESSION_TTL_SECONDS),
        )
    )
    db.commit()
    return token


def resolve_session(db: Session, token: str) -> User | None:
    """Bearer token -> user, with expiry enforcement."""
    session = (
        db.execute(
            select(SessionToken).where(SessionToken.token_hash == hash_token(token))
        )
        .scalars()
        .one_or_none()
    )

    if session is None:
        return None

    if session.expires_at <= datetime.utcnow():
        db.delete(session)
        db.commit()
        return None

    return session.user


def revoke_session(db: Session, token: str) -> None:
    session = (
        db.execute(
            select(SessionToken).where(SessionToken.token_hash == hash_token(token))
        )
        .scalars()
        .one_or_none()
    )
    if session is not None:
        db.delete(session)
        db.commit()


def issue_email_code(db: Session, user: User) -> str:
    code = generate_code()
    user.email_code = code
    user.email_code_expires_at = datetime.utcnow() + timedelta(
        seconds=EMAIL_CODE_TTL_SECONDS
    )
    db.commit()
    return code


def verify_email_code(db: Session, email: str, code: str) -> User:
    user = get_user_by_email(db, email)

    if user is None:
        raise HTTPException(status_code=404, detail="No account found with this email.")

    if user.email_verified:
        return user

    if (
        user.email_code is None
        or user.email_code != code
        or user.email_code_expires_at is None
        or user.email_code_expires_at <= datetime.utcnow()
    ):
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")

    user.email_verified = True
    user.email_code = None
    user.email_code_expires_at = None
    db.commit()
    db.refresh(user)
    return user


def resend_email_code(db: Session, email: str) -> tuple[User, str]:
    """Regenerate the verification code. Returns (user, new code).

    Enforces a server-side cooldown between codes. Invalidates the previous
    code by overwriting it. Raises 404 for unknown emails / 409 if verified.
    """
    user = get_user_by_email(db, email)

    if user is None:
        raise HTTPException(status_code=404, detail="No account found with this email.")

    if user.email_verified:
        raise HTTPException(status_code=409, detail="Email is already verified.")

    if user.email_code_expires_at is not None:
        issued_at = user.email_code_expires_at - timedelta(seconds=EMAIL_CODE_TTL_SECONDS)
        cooldown_until = issued_at + timedelta(seconds=EMAIL_RESEND_COOLDOWN_SECONDS)
        if datetime.utcnow() < cooldown_until:
            raise HTTPException(
                status_code=429,
                detail="Please wait before requesting another verification code.",
            )

    code = issue_email_code(db, user)
    email_service.send_verification_email(user.email, code)
    return user, code


def request_password_reset(db: Session, email: str) -> tuple[User | None, str | None]:
    """Generate a reset code when the account exists.

    Returns (user, code); (None, None) when the email is unknown so the
    endpoint can answer identically either way (no account enumeration).
    """
    user = get_user_by_email(db, email)
    if user is None:
        return None, None

    code = generate_code()
    user.reset_code = code
    user.reset_code_expires_at = datetime.utcnow() + timedelta(
        seconds=RESET_CODE_TTL_SECONDS
    )
    db.commit()
    email_service.send_password_reset_email(user.email, code)
    return user, code


def reset_password(
    db: Session,
    token: str,
    new_password: str,
    email: str | None = None,
) -> User:
    """Complete a password reset with the emailed code.

    The code identifies the account (optionally disambiguated by email);
    using it rotates the password and revokes every existing session.
    """
    query = select(User).where(User.reset_code == token)
    if email:
        query = query.where(User.email == email.strip().lower())

    candidates = db.execute(query).scalars().all()

    now = datetime.utcnow()
    user = next(
        (
            candidate
            for candidate in candidates
            if candidate.reset_code_expires_at
            and candidate.reset_code_expires_at > now
        ),
        None,
    )

    if user is None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")

    user.password_hash = hash_password(new_password)
    user.reset_code = None
    user.reset_code_expires_at = None

    # Every session is revoked — the user must sign in with the new password.
    db.query(SessionToken).filter(SessionToken.user_id == user.id).delete(
        synchronize_session=False
    )

    db.commit()
    db.refresh(user)
    return user
