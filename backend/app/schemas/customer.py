from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import Field, field_validator

from app.schemas.common import ORMModel, StrictModel, normalize_phone_number


class CustomerCreate(StrictModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=8, max_length=30)
    address: str | None = Field(default=None, max_length=255)
    notes: str | None = None

    @field_validator("phone", mode="before")
    @classmethod
    def normalize_phone(cls, value: object) -> object:
        if value is None or isinstance(value, str):
            return normalize_phone_number(value)
        return value


class CustomerInput(StrictModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=8, max_length=30)
    address: str | None = Field(default=None, max_length=255)
    notes: str | None = None

    @field_validator("phone", mode="before")
    @classmethod
    def normalize_phone(cls, value: object) -> object:
        if value is None or isinstance(value, str):
            return normalize_phone_number(value)
        return value


class CustomerUpdate(StrictModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = Field(default=None, min_length=8, max_length=30)
    address: str | None = Field(default=None, max_length=255)
    notes: str | None = None

    @field_validator("phone", mode="before")
    @classmethod
    def normalize_phone(cls, value: object) -> object:
        if value is None or isinstance(value, str):
            return normalize_phone_number(value)
        return value


class CustomerRead(ORMModel):
    id: uuid.UUID
    name: str
    phone: str
    address: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None


class CustomerPurchaseSummary(StrictModel):
    piano_id: uuid.UUID
    piano_name: str
    serial_number: str
    sale_date: str
    warranty_end_date: str | None
    warranty_status: str | None


class CustomerServiceSummary(StrictModel):
    piano_name: str
    service_date: str
    service_type: str
    next_service_date: str | None
    status: str


class CustomerProfile(StrictModel):
    customer: CustomerRead
    purchases: list[CustomerPurchaseSummary]
    services: list[CustomerServiceSummary]
