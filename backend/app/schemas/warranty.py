from __future__ import annotations

import uuid
from datetime import date

from pydantic import Field, field_validator

from app.core.exceptions import BusinessRuleError
from app.schemas.common import StrictModel
from app.schemas.customer import CustomerInput


class WarrantyCreate(StrictModel):
    customer: CustomerInput
    piano_name: str = Field(min_length=1, max_length=255)
    serial_number: str | None = Field(default=None, max_length=120)
    sale_date: date
    warranty_months: int = Field(default=12, ge=1, le=120)
    notes: str | None = None

    @field_validator("piano_name", mode="before")
    @classmethod
    def normalize_piano_name(cls, value: object) -> object:
        if value is None or isinstance(value, str):
            return value.strip() if isinstance(value, str) else value
        return value

    @field_validator("serial_number", mode="before")
    @classmethod
    def normalize_serial(cls, value: object) -> object:
        if value is None or isinstance(value, str):
            if not isinstance(value, str):
                return value
            cleaned = value.strip().upper()
            return cleaned or None
        return value

    @field_validator("sale_date")
    @classmethod
    def validate_sale_date(cls, value: date) -> date:
        if value > date.today():
            raise BusinessRuleError("Ngày bán phải nhỏ hơn hoặc bằng ngày hiện tại")
        return value


class WarrantyDetail(StrictModel):
    id: uuid.UUID
    sale_id: uuid.UUID
    customer_id: uuid.UUID
    customer_name: str
    customer_phone: str
    customer_address: str | None
    piano_id: uuid.UUID
    piano_name: str
    serial_number: str | None
    start_date: date
    end_date: date
    status: str
    days_remaining: int
    notes: str | None
    sale_date: date | None = None
    warranty_id: uuid.UUID | None = None
