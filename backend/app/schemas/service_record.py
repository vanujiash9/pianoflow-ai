from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import Field

from app.models.enums import ServiceStatus
from app.schemas.common import ORMModel, StrictModel


class ServiceRecordCreate(StrictModel):
    customer_id: uuid.UUID
    piano_id: uuid.UUID
    service_date: date
    service_type: str = Field(min_length=2, max_length=100)
    description: str | None = None
    next_service_date: date | None = None
    status: ServiceStatus = ServiceStatus.SCHEDULED
    notes: str | None = None


class ServiceRecordUpdate(StrictModel):
    service_date: date | None = None
    service_type: str | None = Field(default=None, min_length=2, max_length=100)
    description: str | None = None
    next_service_date: date | None = None
    status: ServiceStatus | None = None
    notes: str | None = None


class ServiceRecordRead(ORMModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    piano_id: uuid.UUID
    service_date: date
    service_type: str
    description: str | None
    next_service_date: date | None
    status: ServiceStatus
    notes: str | None
    created_at: datetime


class ServiceRecordDetail(StrictModel):
    id: uuid.UUID
    customer_name: str
    customer_phone: str
    piano_name: str
    serial_number: str
    service_date: date
    service_type: str
    description: str | None
    next_service_date: date | None
    status: ServiceStatus
    notes: str | None
