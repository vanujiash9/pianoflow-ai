from __future__ import annotations

import uuid
from datetime import date, timedelta

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.lead import Lead
from app.schemas.lead import LeadCreate, LeadUpdate


class LeadRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, search: str | None = None) -> list[Lead]:
        stmt = select(Lead).order_by(Lead.follow_up_date.is_(None), Lead.follow_up_date, Lead.created_at.desc())
        if search:
            pattern = f"%{search.strip()}%"
            stmt = stmt.where(or_(Lead.customer_name.ilike(pattern), Lead.phone.ilike(pattern)))
        return list(self.db.scalars(stmt).all())

    def get(self, lead_id: uuid.UUID) -> Lead | None:
        return self.db.get(Lead, lead_id)

    def followups_within(self, days: int) -> list[Lead]:
        today = date.today()
        until = today + timedelta(days=days)
        stmt = (
            select(Lead)
            .where(Lead.follow_up_date.is_not(None), Lead.follow_up_date >= today, Lead.follow_up_date <= until)
            .order_by(Lead.follow_up_date)
        )
        return list(self.db.scalars(stmt).all())

    def create(self, data: LeadCreate) -> Lead:
        entity = Lead(**data.model_dump())
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def update(self, entity: Lead, data: LeadUpdate) -> Lead:
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(entity, key, value)
        self.db.commit()
        self.db.refresh(entity)
        return entity
