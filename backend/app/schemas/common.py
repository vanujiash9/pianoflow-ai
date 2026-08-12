from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


def normalize_serial_number(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip().upper()
    return cleaned or None


def normalize_phone_number(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    return cleaned or None
