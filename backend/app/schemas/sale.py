from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import Field, model_validator

from app.core.exceptions import BusinessRuleError
from app.schemas.common import ORMModel, StrictModel
from app.schemas.customer import CustomerInput


class SaleCreate(StrictModel):
    customer_id: uuid.UUID | None = None
    customer: CustomerInput | None = None
    piano_id: uuid.UUID | None = None
    serial_number: str | None = None
    sale_date: date
    warranty_months: int = Field(default=12, ge=1, le=120)
    notes: str | None = None

    @model_validator(mode="after")
    def validate_payload(self) -> "SaleCreate":
        if self.customer_id is None and self.customer is None:
            raise BusinessRuleError("Phải cung cấp khách hàng hoặc customer_id")
        if self.piano_id is None and not self.serial_number:
            raise BusinessRuleError("Phải cung cấp piano_id hoặc serial_number")
        if self.sale_date > date.today():
            raise BusinessRuleError("Ngày bán phải nhỏ hơn hoặc bằng ngày hiện tại")
        return self


class SaleRead(ORMModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    piano_id: uuid.UUID
    sale_date: date
    notes: str | None
    created_at: datetime


class SaleUpdate(StrictModel):
    notes: str | None = None


class SaleDetail(StrictModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    customer_name: str
    customer_phone: str
    customer_address: str | None
    piano_id: uuid.UUID
    piano_name: str
    serial_number: str | None
    sale_date: date
    warranty_id: uuid.UUID | None = None
    warranty_start_date: date | None = None
    warranty_end_date: date | None = None
    notes: str | None
