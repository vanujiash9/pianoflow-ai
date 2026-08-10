from __future__ import annotations

import uuid
from datetime import date

from app.schemas.common import StrictModel


class WarrantyDetail(StrictModel):
    id: uuid.UUID
    sale_id: uuid.UUID
    customer_id: uuid.UUID
    customer_name: str
    customer_phone: str
    piano_id: uuid.UUID
    piano_name: str
    serial_number: str
    start_date: date
    end_date: date
    status: str
    days_remaining: int
    notes: str | None
