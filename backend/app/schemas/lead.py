from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import Field

from app.models.enums import LeadStatus
from app.schemas.common import ORMModel, StrictModel


class LeadCreate(StrictModel):
    customer_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=8, max_length=30)
    budget_min: int | None = Field(default=None, ge=0)
    budget_max: int | None = Field(default=None, ge=0)
    interested_brand: str | None = Field(default=None, max_length=80)
    interested_model: str | None = Field(default=None, max_length=120)
    status: LeadStatus = LeadStatus.NEW
    follow_up_date: date | None = None
    notes: str | None = None


class LeadUpdate(StrictModel):
    customer_name: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = Field(default=None, min_length=8, max_length=30)
    budget_min: int | None = Field(default=None, ge=0)
    budget_max: int | None = Field(default=None, ge=0)
    interested_brand: str | None = Field(default=None, max_length=80)
    interested_model: str | None = Field(default=None, max_length=120)
    status: LeadStatus | None = None
    follow_up_date: date | None = None
    notes: str | None = None


class LeadRead(ORMModel):
    id: uuid.UUID
    customer_name: str
    phone: str
    budget_min: int | None
    budget_max: int | None
    interested_brand: str | None
    interested_model: str | None
    status: LeadStatus
    follow_up_date: date | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
