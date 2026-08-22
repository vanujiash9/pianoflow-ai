from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import Field, field_validator

from app.core.exceptions import BusinessRuleError
from app.schemas.common import ORMModel, StrictModel, normalize_phone_number


def has_letter(value: str) -> bool:
    return any(char.isalpha() for char in value)


def has_digit(value: str) -> bool:
    return any(char.isdigit() for char in value)


def is_ten_digit_phone(value: str) -> bool:
    return len(value) == 10 and value.isdigit()


def has_address_character(value: str) -> bool:
    return has_letter(value)


class CustomerCreate(StrictModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=8, max_length=30)
    address: str | None = Field(default=None, max_length=255)
    notes: str | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        trimmed = value.strip()
        if not has_letter(trimmed):
            raise BusinessRuleError("Họ tên phải có chữ.")
        if has_digit(trimmed):
            raise BusinessRuleError("Họ tên không được chứa số.")
        return trimmed

    @field_validator("phone", mode="before")
    @classmethod
    def normalize_phone(cls, value: object) -> object:
        if value is None or isinstance(value, str):
            return normalize_phone_number(value)
        return value

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        if not is_ten_digit_phone(value):
            raise BusinessRuleError("Số điện thoại phải đủ 10 chữ số.")
        return value

    @field_validator("address")
    @classmethod
    def validate_address(cls, value: str | None) -> str | None:
        if value is None:
            return value
        trimmed = value.strip()
        if trimmed and not has_address_character(trimmed):
            raise BusinessRuleError("Địa chỉ phải có chữ.")
        return trimmed


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

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        trimmed = value.strip()
        if not has_letter(trimmed):
            raise BusinessRuleError("Họ tên phải có chữ.")
        if has_digit(trimmed):
            raise BusinessRuleError("Họ tên không được chứa số.")
        return trimmed

    @field_validator("phone", mode="before")
    @classmethod
    def normalize_phone(cls, value: object) -> object:
        if value is None or isinstance(value, str):
            return normalize_phone_number(value)
        return value

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        if not is_ten_digit_phone(value):
            raise BusinessRuleError("Số điện thoại phải đủ 10 chữ số.")
        return value

    @field_validator("address")
    @classmethod
    def validate_address(cls, value: str | None) -> str | None:
        if value is None:
            return value
        trimmed = value.strip()
        if trimmed and not has_address_character(trimmed):
            raise BusinessRuleError("Địa chỉ phải có chữ.")
        return trimmed


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
