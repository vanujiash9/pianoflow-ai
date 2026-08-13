from __future__ import annotations

import uuid
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.customer import Customer
from app.models.enums import LeadStatus
from app.models.lead import Lead
from app.schemas.lead import LeadCreate, LeadUpdate

ACTIVE_LEAD_STATUSES = (
    LeadStatus.NEW,
    LeadStatus.CONTACTED,
    LeadStatus.VISITED,
    LeadStatus.CONSIDERING,
)


class LeadRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, search: str | None = None) -> list[Lead]:
        stmt = select(Lead).options(joinedload(Lead.customer)).order_by(
            Lead.follow_up_date.is_(None), Lead.follow_up_date, Lead.created_at.desc()
        )
        if search:
            pattern = f"%{search.strip()}%"
            stmt = stmt.join(Lead.customer).where(Customer.name.ilike(pattern) | Customer.phone.ilike(pattern))
        return list(self.db.scalars(stmt).unique().all())

    def get_by_id(self, lead_id: uuid.UUID) -> Lead | None:
        stmt = select(Lead).where(Lead.id == lead_id).options(joinedload(Lead.customer))
        return self.db.scalar(stmt)

    def get_active_by_customer_id(self, customer_id: uuid.UUID, *, exclude_id: uuid.UUID | None = None) -> Lead | None:
        stmt = select(Lead).where(Lead.customer_id == customer_id, Lead.status.in_(ACTIVE_LEAD_STATUSES))
        if exclude_id is not None:
            stmt = stmt.where(Lead.id != exclude_id)
        return self.db.scalar(stmt.options(joinedload(Lead.customer)).order_by(Lead.created_at.desc()))

    def followups_within(self, days: int) -> list[Lead]:
        today = date.today()
        until = today + timedelta(days=days)
        stmt = (
            select(Lead)
            .where(Lead.follow_up_date.is_not(None), Lead.follow_up_date >= today, Lead.follow_up_date <= until)
            .options(joinedload(Lead.customer))
            .order_by(Lead.follow_up_date)
        )
        return list(self.db.scalars(stmt).unique().all())

    def create(self, *, customer_id: uuid.UUID, data: LeadCreate) -> Lead:
        entity = Lead(
            customer_id=customer_id,
            budget_min=data.budget_min,
            budget_max=data.budget_max,
            interested_brand=data.interested_brand,
            interested_model=data.interested_model,
            status=data.status,
            follow_up_date=data.follow_up_date,
            notes=data.notes,
        )
        self.db.add(entity)
        self.db.flush()
        return entity

    def update(self, entity: Lead, data: LeadUpdate) -> Lead:
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(entity, key, value)
        self.db.flush()
        return entity

    def update_status(self, entity: Lead, status: LeadStatus) -> Lead:
        entity.status = status
        self.db.flush()
        return entity
