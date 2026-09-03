from pydantic import BaseModel, Field, field_validator

from app.schemas.user import UserResponse, validate_email


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: str = Field(min_length=5, max_length=320)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name cannot be blank")
        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return validate_email(value)


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=320)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return validate_email(value)


class VerifyEmailRequest(BaseModel):
    email: str = Field(min_length=5, max_length=320)
    code: str = Field(min_length=6, max_length=6)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return validate_email(value)


class ResendVerificationRequest(BaseModel):
    email: str = Field(min_length=5, max_length=320)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return validate_email(value)


class ForgotPasswordRequest(BaseModel):
    email: str = Field(min_length=5, max_length=320)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return validate_email(value)


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=6, max_length=10)
    password: str = Field(min_length=8, max_length=128)
    email: str | None = Field(default=None, max_length=320)


class MessageResponse(BaseModel):
    message: str
    dev_code: str | None = None


class AuthResponse(BaseModel):
    """Register/login response.

    `dev_code` carries the email-verification code in development (DEBUG)
    mode only, because no mail server is wired up yet. It is never included
    in production responses.
    """

    user: UserResponse
    token: str
    dev_code: str | None = None
