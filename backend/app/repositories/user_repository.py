from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_username(self, username: str) -> User | None:
        stmt = select(User).where(User.username == username)
        return self.db.scalar(stmt)

    def get(self, user_id: uuid.UUID) -> User | None:
        return self.db.get(User, user_id)

    def create(self, *, username: str, password_hash: str, role: str = "admin") -> User:
        entity = User(username=username, password_hash=password_hash, role=role)
        self.db.add(entity)
        self.db.flush()
        return entity
