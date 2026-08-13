from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import Field, field_validator

from app.models.enums import PianoCondition, PianoStatus, PianoType
from app.schemas.common import ORMModel, StrictModel, normalize_serial_number


class PianoCreate(StrictModel):
    brand: str = Field(min_length=1, max_length=80)
    model: str = Field(min_length=1, max_length=120)
    year: int | None = Field(default=None, ge=0)
    serial_number: str | None = Field(default=None, min_length=2, max_length=120)
    piano_type: PianoType = PianoType.UPRIGHT
    size_cm: int | None = Field(default=None, ge=0)
    pedal_count: int | None = Field(default=None, ge=0)
    purchase_price: Decimal | None = Field(default=None, ge=0)
    retail_price: Decimal | None = Field(default=None, ge=0)
    status: PianoStatus = PianoStatus.AVAILABLE
    quantity: int = Field(default=1, ge=1)
    variant: str | None = Field(default=None, max_length=120)
    arrival_date: date | None = None
    color: str | None = Field(default=None, max_length=60)
    condition: PianoCondition = PianoCondition.USED
    notes: str | None = None

    @field_validator("purchase_price", "retail_price", mode="before")
    @classmethod
    def parse_price(cls, value: object) -> object:
        if value is None or isinstance(value, Decimal):
            return value
        return Decimal(str(value))

    @field_validator("serial_number", mode="before")
    @classmethod
    def normalize_serial(cls, value: object) -> object:
        if value is None or isinstance(value, str):
            return normalize_serial_number(value)
        return value


class PianoUpdate(StrictModel):
    brand: str | None = Field(default=None, min_length=1, max_length=80)
    model: str | None = Field(default=None, min_length=1, max_length=120)
    year: int | None = Field(default=None, ge=0)
    serial_number: str | None = Field(default=None, min_length=2, max_length=120)
    piano_type: PianoType | None = None
    size_cm: int | None = Field(default=None, ge=0)
    pedal_count: int | None = Field(default=None, ge=0)
    purchase_price: Decimal | None = Field(default=None, ge=0)
    retail_price: Decimal | None = Field(default=None, ge=0)
    status: PianoStatus | None = None
    quantity: int | None = Field(default=None, ge=1)
    variant: str | None = Field(default=None, max_length=120)
    arrival_date: date | None = None
    color: str | None = Field(default=None, max_length=60)
    condition: PianoCondition | None = None
    notes: str | None = None

    @field_validator("purchase_price", "retail_price", mode="before")
    @classmethod
    def parse_price(cls, value: object) -> object:
        if value is None or isinstance(value, Decimal):
            return value
        return Decimal(str(value))

    @field_validator("serial_number", mode="before")
    @classmethod
    def normalize_serial(cls, value: object) -> object:
        if value is None or isinstance(value, str):
            return normalize_serial_number(value)
        return value


class PianoRead(ORMModel):
    id: uuid.UUID
    brand: str
    model: str
    year: int | None
    serial_number: str | None
    piano_type: PianoType
    size_cm: int | None
    pedal_count: int | None
    purchase_price: Decimal | None
    retail_price: Decimal | None
    status: PianoStatus
    quantity: int
    variant: str | None
    arrival_date: date | None
    color: str | None
    condition: PianoCondition
    notes: str | None
    created_at: datetime
    updated_at: datetime