from __future__ import annotations

import uuid

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate


class CustomerRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, search: str | None = None) -> list[Customer]:
        stmt = select(Customer).order_by(Customer.created_at.desc())
        if search:
            pattern = f"%{search.strip()}%"
            stmt = stmt.where(or_(Customer.name.ilike(pattern), Customer.phone.ilike(pattern)))
        return list(self.db.scalars(stmt).all())

    def get(self, customer_id: uuid.UUID) -> Customer | None:
        return self.db.get(Customer, customer_id)

    def get_by_phone(self, phone: str) -> Customer | None:
        return self.db.scalar(select(Customer).where(Customer.phone == phone))

    def search_by_name_or_phone(self, query: str) -> list[Customer]:
        pattern = f"%{query.strip()}%"
        stmt = (
            select(Customer)
            .where(or_(Customer.name.ilike(pattern), Customer.phone.ilike(pattern)))
            .options(selectinload(Customer.sales))
            .limit(10)
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
