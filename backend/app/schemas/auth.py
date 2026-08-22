from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import Field

from app.schemas.common import ORMModel, StrictModel


class LoginRequest(StrictModel):
    username: str = Field(min_length=3, max_length=80)
    password: str = Field(min_length=1, max_length=200)


class AuthUser(ORMModel):
    id: uuid.UUID
    username: str
    role: str
    is_active: bool
    last_login_at: datetime | None = None


class RegisterRequest(StrictModel):
    username: str = Field(min_length=3, max_length=80)
    password: str = Field(min_length=8, max_length=200)
    current_password: str = Field(min_length=1, max_length=200)


class AuthResponse(StrictModel):
    user: AuthUser
