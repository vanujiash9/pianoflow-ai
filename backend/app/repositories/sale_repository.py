from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.sale import Sale


class SaleRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self) -> list[Sale]:
        stmt = (
            select(Sale)
            .options(joinedload(Sale.customer), joinedload(Sale.piano), joinedload(Sale.warranty))
            .order_by(Sale.sale_date.desc())
        )
        return list(self.db.scalars(stmt).unique().all())

    def get(self, sale_id: uuid.UUID) -> Sale | None:
        stmt = (
            select(Sale)
            .where(Sale.id == sale_id)
            .options(joinedload(Sale.customer), joinedload(Sale.piano), joinedload(Sale.warranty))
        )
        return self.db.scalar(stmt)

    def list_by_customer(self, customer_id: uuid.UUID) -> list[Sale]:
        stmt = (
            select(Sale)
            .where(Sale.customer_id == customer_id)
            .options(joinedload(Sale.piano), joinedload(Sale.warranty))
            .order_by(Sale.sale_date.desc())
        )
        return list(self.db.scalars(stmt).unique().all())

    def create(self, *, customer_id: uuid.UUID, piano_id: uuid.UUID, sale_date: date, notes: str | None) -> Sale:
        entity = Sale(customer_id=customer_id, piano_id=piano_id, sale_date=sale_date, notes=notes)
        self.db.add(entity)
        self.db.flush()
        return entity

    def update(self, entity: Sale, data) -> Sale:
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(entity, key, value)
        self.db.commit()
        self.db.refresh(entity)
        return entity
