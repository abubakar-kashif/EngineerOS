from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.database import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResendVerificationRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
)
from app.services import auth_service, user_service

router = APIRouter(prefix="/api/auth", tags=["Auth"])


def _dev_code(code: str | None) -> str | None:
    """Codes are only exposed in DEBUG builds (no mail server in dev)."""
    return code if settings.DEBUG else None


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    user, code = auth_service.create_user(db, payload)
    token = auth_service.issue_token(db, user, request.headers.get("user-agent"))

    return AuthResponse(
        user=user_service.build_user_response(db, user, token),
        token=token,
        dev_code=_dev_code(code),
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = auth_service.authenticate(db, payload.email, payload.password)
    token = auth_service.issue_token(db, user, request.headers.get("user-agent"))

    return AuthResponse(
        user=user_service.build_user_response(db, user, token),
        token=token,
    )


@router.get("/me", response_model=AuthResponse)
def current_user(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Single reliable source of identity: safe account info +
    preferences + live sessions. Consumed by the frontend AuthContext."""
    token = _bearer_token(request)
    return AuthResponse(
        user=user_service.build_user_response(db, user, token),
        token=token or "",
    )


@router.post("/logout", response_model=MessageResponse)
def logout(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    token = _bearer_token(request)
    if token:
        auth_service.revoke_session(db, token)
    return MessageResponse(message="Signed out successfully.")


@router.post("/verify", response_model=MessageResponse)
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    auth_service.verify_email_code(db, payload.email, payload.code)
    return MessageResponse(message="Email verified successfully.")


@router.post("/resend", response_model=MessageResponse)
def resend_verification(
    payload: ResendVerificationRequest, db: Session = Depends(get_db)
):
    _user, code = auth_service.resend_email_code(db, payload.email)
    return MessageResponse(
        message="Verification code sent.",
        dev_code=_dev_code(code),
    )


@router.post("/forgot", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    _user, code = auth_service.request_password_reset(db, payload.email)
    # Same response whether or not the account exists (no enumeration).
    return MessageResponse(
        message="If an account exists with this email, a reset code has been sent.",
        dev_code=_dev_code(code),
    )


@router.post("/reset", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    auth_service.reset_password(
        db,
        payload.token,
        payload.password,
        email=payload.email,
    )
    return MessageResponse(message="Password has been reset successfully.")


def _bearer_token(request: Request) -> str | None:
    header = request.headers.get("Authorization", "")
    if header.lower().startswith("bearer "):
        return header[7:].strip()
    return None
