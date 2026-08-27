from __future__ import annotations

from types import SimpleNamespace

import asyncio

from sqlalchemy.exc import SQLAlchemyError

import app.main as main_module
from app.models.user import User


class _FakeUser:
    def __init__(self) -> None:
        self.password_hash = "old-hash"
        self.role = "user"
        self.is_active = False


class _FailingSession:
    def __init__(self, *, failure: Exception) -> None:
        self.failure = failure
        self.rollback_called = False
        self.close_called = False
        self.added: list[object] = []

    def __enter__(self) -> _FailingSession:
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        self.close()

    def scalar(self, statement):  # noqa: ANN001
        raise self.failure

    def add(self, obj) -> None:  # noqa: ANN001
        self.added.append(obj)

    def commit(self) -> None:
        raise AssertionError("commit should not be reached")

    def rollback(self) -> None:
        self.rollback_called = True

    def close(self) -> None:
        self.close_called = True


class _SuccessfulSession(_FailingSession):
    def __init__(self, *, user):
        super().__init__(failure=RuntimeError("unused"))
        self.user = user
        self.commits = 0

    def scalar(self, statement):  # noqa: ANN001
        return self.user

    def commit(self) -> None:
        self.commits += 1


async def _run_lifespan() -> None:
    async with main_module.lifespan(SimpleNamespace()):
        pass


def test_lifespan_skips_auth_seed_when_database_is_unavailable(monkeypatch, caplog):
    session = _FailingSession(failure=SQLAlchemyError("db down"))

    monkeypatch.setattr(main_module, "SessionLocal", lambda: session)

    with caplog.at_level("WARNING"):
        asyncio.run(_run_lifespan())

    assert session.rollback_called is True
    assert session.close_called is True
    assert "Skipping auth seed during startup" in caplog.text


def test_lifespan_updates_existing_seed_user(monkeypatch):
    user = _FakeUser()
    session = _SuccessfulSession(user=user)

    monkeypatch.setattr(main_module, "SessionLocal", lambda: session)

    asyncio.run(_run_lifespan())

    assert user.is_active is True
    assert user.role == main_module.settings.auth_seed_role
    assert user.password_hash != "old-hash"
    assert session.commits == 1
    assert session.close_called is True


def test_lifespan_inserts_missing_seed_user(monkeypatch):
    session = _SuccessfulSession(user=None)

    monkeypatch.setattr(main_module, "SessionLocal", lambda: session)

    asyncio.run(_run_lifespan())

    assert len(session.added) == 1
    created_user = session.added[0]
    assert isinstance(created_user, User)
    assert created_user.username == main_module.settings.auth_seed_username
    assert created_user.role == main_module.settings.auth_seed_role
    assert created_user.is_active is True
    assert session.commits == 1
    assert session.close_called is True
