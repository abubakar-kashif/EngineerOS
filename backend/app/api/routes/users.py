from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.user import (
    ChangePasswordRequest,
    PreferencesResponse,
    PreferencesUpdateRequest,
    ProfileUpdateRequest,
    UserResponse,
)
from app.services import user_service

router = APIRouter(prefix="/api/users", tags=["Users"])


def _bearer_token(request: Request) -> str | None:
    header = request.headers.get("Authorization", "")
    if header.lower().startswith("bearer "):
        return header[7:].strip()
    return None


@router.get("/me", response_model=UserResponse)
def get_my_profile(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_service.build_user_response(db, user, _bearer_token(request))


@router.patch("/me", response_model=UserResponse)
def update_my_profile(
    payload: ProfileUpdateRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_service.update_profile(db, user, payload)


@router.put("/me/password", response_model=MessageResponse)
def change_my_password(
    payload: ChangePasswordRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    revoked = user_service.change_password(
        db,
        user,
        current_token=_bearer_token(request),
        current_password=payload.current_password,
        new_password=payload.new_password,
    )
    message = "Password updated successfully."
    if revoked:
        message += f" {revoked} other session(s) were signed out."
    return MessageResponse(message=message)


@router.delete("/me/sessions", response_model=MessageResponse)
def sign_out_other_sessions(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Revoke every session except the one making the request."""
    revoked = user_service.revoke_other_sessions(db, user, _bearer_token(request))
    message = f"Signed out {revoked} other session(s)."
    if revoked == 0:
        message = "No other active sessions found."
    return MessageResponse(message=message)


@router.delete("/me/sessions/{session_id}", response_model=MessageResponse)
def revoke_single_session(
    session_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Revoke one session by id (ownership enforced server-side)."""
    user_service.revoke_session(db, user, session_id)
    return MessageResponse(message="Session revoked.")


@router.get("/me/preferences", response_model=PreferencesResponse)
def get_my_preferences(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    preferences = user_service.ensure_preferences(db, user)
    return PreferencesResponse.model_validate(preferences)


@router.patch("/me/preferences", response_model=PreferencesResponse)
def update_my_preferences(
    payload: PreferencesUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_service.update_preferences(db, user, payload)
