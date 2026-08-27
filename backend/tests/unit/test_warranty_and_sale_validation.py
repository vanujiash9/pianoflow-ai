from __future__ import annotations

from datetime import date, timedelta

import pytest
from pydantic import ValidationError

from app.core.exceptions import BusinessRuleError
from app.models.enums import ServiceStatus
from app.schemas.sale import SaleCreate


def test_sale_create_rejects_zero_warranty_months():
    with pytest.raises(ValidationError):
        SaleCreate(
            customer_id="11111111-1111-1111-1111-111111111111",
            piano_id="22222222-2222-2222-2222-222222222222",
            sale_date=date.today(),
            warranty_months=0,
        )


def test_sale_create_rejects_future_sale_date():
    with pytest.raises(BusinessRuleError):
        SaleCreate(
            customer_id="11111111-1111-1111-1111-111111111111",
            piano_id="22222222-2222-2222-2222-222222222222",
            sale_date=date.today() + timedelta(days=1),
            warranty_months=12,
        )


def test_sale_create_accepts_valid_payload():
    payload = SaleCreate(
        customer_id="11111111-1111-1111-1111-111111111111",
        piano_id="22222222-2222-2222-2222-222222222222",
        sale_date=date.today(),
        warranty_months=12,
    )

    assert payload.warranty_months == 12


def test_service_status_values_match_database_schema():
    assert [status.value for status in ServiceStatus] == [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
    ]
