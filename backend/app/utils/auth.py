from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from app.core.config import get_settings

SESSION_SEPARATOR = "."
COOKIE_NAME = "pianoflow_session"
DEFAULT_SESSION_TTL_HOURS = 12
DEFAULT_PASSWORD_ITERATIONS = 210_000


def get_auth_secret() -> str:
    settings = get_settings()
    secret = getattr(settings, "auth_secret", "")
    if not secret:
        raise RuntimeError("AUTH_SECRET is not configured")
    return secret


def _derive_key(password: str, salt: bytes, iterations: int) -> bytes:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)


def hash_password(password: str, *, salt: bytes | None = None, iterations: int | None = None) -> str:
    iterations = iterations or DEFAULT_PASSWORD_ITERATIONS
    salt = salt or secrets.token_bytes(16)
    derived = _derive_key(password, salt, iterations)
    return f"pbkdf2_sha256${iterations}${base64.urlsafe_b64encode(salt).decode()}${base64.urlsafe_b64encode(derived).decode()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algorithm, iteration_text, salt_text, hash_text = stored.split("$", 3)
    except ValueError:
        return False
    if algorithm != "pbkdf2_sha256":
        return False
    try:
        iterations = int(iteration_text)
        salt = base64.urlsafe_b64decode(salt_text.encode())
        expected = base64.urlsafe_b64decode(hash_text.encode())
    except Exception:
        return False
    candidate = _derive_key(password, salt, iterations)
    return hmac.compare_digest(candidate, expected)


def create_session_token(user_id: str, *, expires_at: datetime | None = None) -> str:
    expires_at = expires_at or (datetime.now(timezone.utc) + timedelta(hours=DEFAULT_SESSION_TTL_HOURS))
    payload = f"{user_id}{SESSION_SEPARATOR}{int(expires_at.timestamp())}"
    signature = hmac.new(get_auth_secret().encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}{SESSION_SEPARATOR}{signature}"


def verify_session_token(token: str) -> str | None:
    try:
        user_id, expires_text, signature = token.rsplit(SESSION_SEPARATOR, 2)
    except ValueError:
        return None

    payload = f"{user_id}{SESSION_SEPARATOR}{expires_text}"
    expected = hmac.new(get_auth_secret().encode(), payload.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        return None

    try:
        expires_at = datetime.fromtimestamp(int(expires_text), tz=timezone.utc)
    except ValueError:
        return None
    if expires_at <= datetime.now(timezone.utc):
        return None
    return user_id
