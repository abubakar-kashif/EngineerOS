from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, hash_token, verify_password
from app.models.preferences import UserPreferences
from app.models.user import SessionToken, User
from app.schemas.user import (
    PreferencesResponse,
    PreferencesUpdateRequest,
    ProfileUpdateRequest,
    SessionResponse,
    UserResponse,
)


def ensure_preferences(db: Session, user: User) -> UserPreferences:
    """Every user has exactly one preferences row (created lazily)."""
    if user.preferences is None:
        user.preferences = UserPreferences(user_id=user.id)
        db.add(user.preferences)
        db.commit()
        db.refresh(user)
    return user.preferences


def build_user_response(
    db: Session,
    user: User,
    current_token: str | None = None,
) -> UserResponse:
    """Serialize safe account info: profile + preferences + live sessions.

    The current bearer session (if given) is flagged so the Security
    settings page can distinguish it from other devices.
    """
    ensure_preferences(db, user)

    current_hash = hash_token(current_token) if current_token else None
    sessions = (
        db.execute(
            select(SessionToken)
            .where(
                SessionToken.user_id == user.id,
                SessionToken.expires_at > datetime.utcnow(),
            )
            .order_by(SessionToken.created_at.desc())
        )
        .scalars()
        .all()
    )

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        avatar_url=user.avatar_url,
        email_verified=user.email_verified,
        created_at=user.created_at,
        preferences=PreferencesResponse.model_validate(user.preferences),
        sessions=[
            SessionResponse(
                id=session.id,
                created_at=session.created_at,
                expires_at=session.expires_at,
                user_agent=session.user_agent,
                current=session.token_hash == current_hash,
            )
            for session in sessions
        ],
    )


def update_profile(
    db: Session,
    user: User,
    payload: ProfileUpdateRequest,
) -> UserResponse:
    if payload.name is not None:
        user.name = payload.name
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url.strip() or None

    db.commit()
    db.refresh(user)
    return build_user_response(db, user)


def update_preferences(
    db: Session,
    user: User,
    payload: PreferencesUpdateRequest,
) -> PreferencesResponse:
    preferences = ensure_preferences(db, user)

    changes = payload.model_dump(exclude_unset=True, exclude_none=True)
    for field, value in changes.items():
        setattr(preferences, field, value)

    if changes:
        db.commit()
        db.refresh(preferences)

    return PreferencesResponse.model_validate(preferences)


def change_password(
    db: Session,
    user: User,
    current_token: str | None,
    current_password: str,
    new_password: str,
) -> int:
    """Verify the current password, rotate it, revoke other sessions.

    Returns the number of revoked sessions (the current one stays valid so
    the user is not logged out mid-action).
    """
    if not verify_password(current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Your current password is incorrect.")

    user.password_hash = hash_password(new_password)
    user.reset_code = None
    user.reset_code_expires_at = None

    current_hash = hash_token(current_token) if current_token else None
    revoked = (
        db.query(SessionToken)
        .filter(
            SessionToken.user_id == user.id,
            SessionToken.token_hash != current_hash if current_hash else True,
        )
        .delete(synchronize_session=False)
    )

    db.commit()
    return revoked


def revoke_other_sessions(
    db: Session, user: User, current_token: str | None
) -> int:
    """Sign out every session except the current one.

    Returns the number of revoked sessions.
    """
    current_hash = hash_token(current_token) if current_token else None
    revoked = (
        db.query(SessionToken)
        .filter(
            SessionToken.user_id == user.id,
            SessionToken.token_hash != current_hash if current_hash else True,
        )
        .delete(synchronize_session=False)
    )
    db.commit()
    return revoked


def revoke_session(db: Session, user: User, session_id: str) -> None:
    """Revoke a single session by id (Security page per-device revoke).

    Only the owner's sessions can match; a foreign or unknown id produces
    the same 404, so sessions cannot be enumerated across accounts.
    """
    deleted = (
        db.query(SessionToken)
        .filter(
            SessionToken.id == session_id,
            SessionToken.user_id == user.id,
        )
        .delete(synchronize_session=False)
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found.")
    db.commit()
