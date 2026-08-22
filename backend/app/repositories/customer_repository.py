from __future__ import annotations

import datetime as dt
import uuid

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate


class CustomerRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, search: str | None = None) -> list[Customer]:
        stmt = select(Customer).where(Customer.deleted_at.is_(None)).order_by(Customer.created_at.desc())
        if search:
            pattern = f"%{search.strip()}%"
            stmt = stmt.where(or_(Customer.name.ilike(pattern), Customer.phone.ilike(pattern)))
        return list(self.db.scalars(stmt).all())

    def get(self, customer_id: uuid.UUID) -> Customer | None:
        stmt = select(Customer).where(Customer.id == customer_id, Customer.deleted_at.is_(None))
        return self.db.scalar(stmt)

    def get_by_phone(self, phone: str, *, include_deleted: bool = False) -> Customer | None:
        stmt = select(Customer).where(Customer.phone == phone)
        if not include_deleted:
            stmt = stmt.where(Customer.deleted_at.is_(None))
        return self.db.scalar(stmt)

    def search_by_name_or_phone(self, query: str) -> list[Customer]:
        pattern = f"%{query.strip()}%"
        stmt = (
            select(Customer)
            .where(
                Customer.deleted_at.is_(None),
                or_(Customer.name.ilike(pattern), Customer.phone.ilike(pattern)),
            )
            .options(selectinload(Customer.sales))
            .limit(10)
        )
        return list(self.db.scalars(stmt).all())

    def create_entity(self, *, name: str, phone: str, address: str | None, notes: str | None) -> Customer:
        entity = Customer(name=name, phone=phone, address=address, notes=notes)
        self.db.add(entity)
        return entity

    def restore(self, entity: Customer, *, name: str, phone: str, address: str | None, notes: str | None) -> Customer:
        entity.name = name
        entity.phone = phone
        entity.address = address
        entity.notes = notes
        entity.deleted_at = None
        self.db.add(entity)
        return entity

    def soft_delete(self, entity: Customer) -> Customer:
        entity.deleted_at = dt.datetime.now(dt.timezone.utc)
        self.db.add(entity)
        return entity

    def list_deleted_recent(self, limit: int = 5) -> list[Customer]:
        stmt = (
            select(Customer)
            .where(Customer.deleted_at.is_not(None))
            .order_by(Customer.deleted_at.desc())
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())

    def create(self, data: CustomerCreate) -> Customer:
        entity = Customer(**data.model_dump())
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def update(self, entity: Customer, data: CustomerUpdate) -> Customer:
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(entity, key, value)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def soft_delete(self, entity: Customer) -> Customer:
        entity.deleted_at = dt.datetime.now(dt.timezone.utc)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def list_deleted_recent(self, limit: int = 5) -> list[Customer]:
        stmt = (
            select(Customer)
            .where(Customer.deleted_at.is_not(None))
            .order_by(Customer.deleted_at.desc())
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())
