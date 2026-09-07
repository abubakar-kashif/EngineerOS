from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

ThemePreference = Literal["light", "dark", "system"]
DifficultyPreference = Literal["Beginner", "Intermediate", "Advanced"]
ExperimentViewPreference = Literal["overview", "procedure", "simulation"]
FeedbackValue = Literal["helpful", "not_helpful"]

EMAIL_PATTERN = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"


def validate_email(value: str) -> str:
    """Shared email-format check (does not prove the mailbox exists).

    Requires local-part @ domain with at least one dot in the domain
    (e.g. user@gmail.com). Rejects abc, abc@, abc@gmail, @gmail.com.
    """
    import re

    normalized = (value or "").strip().lower()
    if not normalized or not re.fullmatch(EMAIL_PATTERN, normalized):
        raise ValueError("Enter a valid email address")
    # Domain must contain a real label before the TLD (blocks "a@.com").
    domain = normalized.rsplit("@", 1)[-1]
    if domain.startswith(".") or domain.endswith(".") or ".." in domain:
        raise ValueError("Enter a valid email address")
    return normalized


class PreferencesResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    theme: ThemePreference
    preferred_difficulty: DifficultyPreference
    learning_reminders: bool
    default_experiment_view: ExperimentViewPreference
    notify_quiz_results: bool
    notify_report_completion: bool
    notify_learning_reminders: bool
    notify_email: bool
    notify_activity: bool


class PreferencesUpdateRequest(BaseModel):
    """Partial preferences update — only provided fields change."""

    theme: ThemePreference | None = None
    preferred_difficulty: DifficultyPreference | None = None
    learning_reminders: bool | None = None
    default_experiment_view: ExperimentViewPreference | None = None
    notify_quiz_results: bool | None = None
    notify_report_completion: bool | None = None
    notify_learning_reminders: bool | None = None
    notify_email: bool | None = None
    notify_activity: bool | None = None


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    expires_at: datetime
    # User-Agent of the client that opened the session (may be null for
    # rows created before the column existed).
    user_agent: str | None = None
    current: bool = False


class UserResponse(BaseModel):
    """Safe account information — never includes the password hash."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    avatar_url: str | None = None
    email_verified: bool
    created_at: datetime
    preferences: PreferencesResponse
    sessions: list[SessionResponse] = []


class ProfileUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    avatar_url: str | None = Field(default=None, max_length=500)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str | None) -> str | None:
        if value is not None:
            value = value.strip()
            if not value:
                raise ValueError("Name cannot be blank")
        return value


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)
