from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import Field, model_validator

from app.core.exceptions import BusinessRuleError
from app.models.enums import LeadStatus
from app.schemas.common import ORMModel, StrictModel
from app.schemas.customer import CustomerInput, CustomerRead


ACTIVE_LEAD_STATUSES = {
    LeadStatus.NEW,
    LeadStatus.CONTACTED,
    LeadStatus.VISITED,
    LeadStatus.CONSIDERING,
}


class LeadCreate(StrictModel):
    customer_id: uuid.UUID | None = None
    customer: CustomerInput | None = None
    budget_min: int | None = Field(default=None, ge=0)
    budget_max: int | None = Field(default=None, ge=0)
    interested_brand: str | None = Field(default=None, max_length=80)
    interested_model: str | None = Field(default=None, max_length=120)
    status: LeadStatus = LeadStatus.NEW
    follow_up_date: date | None = None
    notes: str | None = None

    @model_validator(mode="after")
    def validate_payload(self) -> "LeadCreate":
        if self.customer_id is None and self.customer is None:
            raise BusinessRuleError("Phải cung cấp khách hàng hoặc customer_id")
        if self.budget_min is not None and self.budget_max is not None and self.budget_min > self.budget_max:
            raise BusinessRuleError("Ngân sách tối thiểu không được lớn hơn ngân sách tối đa")
        return self


class LeadUpdate(StrictModel):
    customer_id: uuid.UUID | None = None
    customer: CustomerInput | None = None
    budget_min: int | None = Field(default=None, ge=0)
    budget_max: int | None = Field(default=None, ge=0)
    interested_brand: str | None = Field(default=None, max_length=80)
    interested_model: str | None = Field(default=None, max_length=120)
    status: LeadStatus | None = None
    follow_up_date: date | None = None
    notes: str | None = None

    @model_validator(mode="after")
    def validate_payload(self) -> "LeadUpdate":
        if self.budget_min is not None and self.budget_max is not None and self.budget_min > self.budget_max:
            raise BusinessRuleError("Ngân sách tối thiểu không được lớn hơn ngân sách tối đa")
        return self


class LeadCustomerSummary(StrictModel):
    id: uuid.UUID
    name: str
    phone: str
    address: str | None


class LeadRead(ORMModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    customer: LeadCustomerSummary
    budget_min: int | None
    budget_max: int | None
    interested_brand: str | None
    interested_model: str | None
    status: LeadStatus
    follow_up_date: date | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
