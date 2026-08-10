from __future__ import annotations

import uuid

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.enums import PianoStatus
from app.models.piano import Piano
from app.schemas.piano import PianoCreate, PianoUpdate


class PianoRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, search: str | None = None, status: PianoStatus | None = None) -> list[Piano]:
        stmt = select(Piano).order_by(Piano.created_at.desc())
        if search:
            pattern = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Piano.brand.ilike(pattern),
                    Piano.model.ilike(pattern),
                    Piano.serial_number.ilike(pattern),
                )
            )
        if status:
            stmt = stmt.where(Piano.status == status)
        return list(self.db.scalars(stmt).all())

    def get(self, piano_id: uuid.UUID) -> Piano | None:
        return self.db.get(Piano, piano_id)

    def get_by_serial(self, serial_number: str) -> Piano | None:
        return self.db.scalar(select(Piano).where(Piano.serial_number == serial_number))

    def search_available(self, brand: str | None = None, model: str | None = None) -> list[Piano]:
        stmt = select(Piano).where(Piano.status == PianoStatus.AVAILABLE)
        if brand:
            stmt = stmt.where(Piano.brand.ilike(f"%{brand}%"))
        if model:
            stmt = stmt.where(Piano.model.ilike(f"%{model}%"))
        return list(self.db.scalars(stmt.order_by(Piano.brand, Piano.model).limit(20)).all())

    def create(self, data: PianoCreate) -> Piano:
        entity = Piano(**data.model_dump())
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def update(self, entity: Piano, data: PianoUpdate) -> Piano:
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(entity, key, value)
        self.db.commit()
        self.db.refresh(entity)
        return entity
