from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import Field

from app.schemas.common import ORMModel, StrictModel


class SaleCreate(StrictModel):
    customer_id: uuid.UUID
    piano_id: uuid.UUID
    sale_date: date
    warranty_months: int = Field(default=12, ge=0, le=120)
    notes: str | None = None


class SaleRead(ORMModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    piano_id: uuid.UUID
    sale_date: date
    notes: str | None
    created_at: datetime


class SaleDetail(StrictModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    customer_name: str
    customer_phone: str
    piano_id: uuid.UUID
    piano_name: str
    serial_number: str | None
    sale_date: date
    warranty_end_date: date | None
    notes: str | None
