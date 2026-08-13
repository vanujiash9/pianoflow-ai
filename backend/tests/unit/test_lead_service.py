from __future__ import annotations

from app.models.enums import LeadStatus
from app.schemas.customer import CustomerCreate, CustomerInput
from app.schemas.lead import LeadCreate, LeadUpdate
from app.services.customer_service import CustomerService
from app.services.lead_service import LeadService


def test_lead_service_reuses_existing_customer_and_sets_customer_id(db_session):
    customer_service = CustomerService(db_session)
    existing = customer_service.create(CustomerCreate(name="Anh Minh", phone="0907111222"))

    lead = LeadService(db_session).create(
        LeadCreate(
            customer=CustomerInput(name="Anh Minh", phone="0907 111 222"),
            budget_min=30000000,
            budget_max=50000000,
        )
    )

    assert lead.customer_id == existing.id
    assert lead.customer.id == existing.id


def test_lead_service_rejects_duplicate_active_lead(db_session):
    customer = CustomerService(db_session).create(CustomerCreate(name="Anh Minh", phone="0907111222"))
    service = LeadService(db_session)
    service.create(LeadCreate(customer_id=customer.id, budget_min=30000000, budget_max=50000000))

    try:
        service.create(LeadCreate(customer_id=customer.id, budget_min=35000000, budget_max=55000000))
    except Exception as exc:
        assert "Khách này đã có trong danh sách khách quan tâm." in str(exc)
    else:
        raise AssertionError("expected duplicate active lead to be rejected")


def test_lead_service_allows_new_lead_after_conversion(db_session):
    customer = CustomerService(db_session).create(CustomerCreate(name="Anh Minh", phone="0907111222"))
    service = LeadService(db_session)
    first = service.create(LeadCreate(customer_id=customer.id, budget_min=30000000, budget_max=50000000))
    service.update(first.id, LeadUpdate(status=LeadStatus.CONVERTED))
    second = service.create(LeadCreate(customer_id=customer.id, budget_min=35000000, budget_max=55000000))

    assert second.customer_id == customer.id
