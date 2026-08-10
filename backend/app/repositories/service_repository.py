from __future__ import annotations

import uuid
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.enums import ServiceStatus
from app.models.service_record import ServiceRecord
from app.schemas.service_record import ServiceRecordCreate, ServiceRecordUpdate


class ServiceRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self) -> list[ServiceRecord]:
        stmt = (
            select(ServiceRecord)
            .options(joinedload(ServiceRecord.customer), joinedload(ServiceRecord.piano))
            .order_by(ServiceRecord.service_date.desc())
        )
        return list(self.db.scalars(stmt).unique().all())

    def get(self, record_id: uuid.UUID) -> ServiceRecord | None:
        return self.db.get(ServiceRecord, record_id)

    def due_within(self, days: int) -> list[ServiceRecord]:
        today = date.today()
        until = today + timedelta(days=days)
        stmt = (
            select(ServiceRecord)
            .where(
                ServiceRecord.next_service_date.is_not(None),
                ServiceRecord.next_service_date >= today,
                ServiceRecord.next_service_date <= until,
                ServiceRecord.status != ServiceStatus.CANCELLED,
            )
            .options(joinedload(ServiceRecord.customer), joinedload(ServiceRecord.piano))
            .order_by(ServiceRecord.next_service_date)
        )
        return list(self.db.scalars(stmt).unique().all())

    def list_by_customer(self, customer_id: uuid.UUID) -> list[ServiceRecord]:
        stmt = (
            select(ServiceRecord)
            .where(ServiceRecord.customer_id == customer_id)
            .options(joinedload(ServiceRecord.piano))
            .order_by(ServiceRecord.service_date.desc())
        )
        return list(self.db.scalars(stmt).unique().all())

    def create(self, data: ServiceRecordCreate) -> ServiceRecord:
        entity = ServiceRecord(**data.model_dump())
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def update(self, entity: ServiceRecord, data: ServiceRecordUpdate) -> ServiceRecord:
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(entity, key, value)
        self.db.commit()
        self.db.refresh(entity)
        return entity
