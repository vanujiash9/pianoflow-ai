from __future__ import annotations

from datetime import date

from app.models.enums import LeadStatus, PianoStatus
from app.schemas.customer import CustomerCreate
from app.schemas.lead import LeadCreate, LeadUpdate
from app.schemas.piano import PianoCreate
from app.schemas.sale import SaleCreate
from app.services.customer_service import CustomerService
from app.services.lead_service import LeadService
from app.services.piano_service import PianoService
from app.services.sale_service import SaleService


def test_sale_service_creates_warranty(db_session):
    customer = CustomerService(db_session).create(CustomerCreate(name="A Test", phone="0999888777"))
    piano = PianoService(db_session).create(
        PianoCreate(
            brand="Yamaha",
            model="U1",
            serial_number="UNIT-U1-1",
            piano_type="upright",
        )
    )
    sale = SaleService(db_session).create(
        SaleCreate(
            customer_id=customer.id,
            piano_id=piano.id,
            sale_date=date(2026, 8, 10),
            warranty_months=12,
        )
    )
    assert sale.warranty_end_date == date(2027, 8, 10)


def test_sale_service_decrements_non_serialized_stock(db_session):
    customer = CustomerService(db_session).create(CustomerCreate(name="B Test", phone="0999888778"))
    piano = PianoService(db_session).create(
        PianoCreate(
            brand="Casio",
            model="PX-1",
            serial_number=None,
            piano_type="digital",
            quantity=2,
            status=PianoStatus.AVAILABLE,
        )
    )
    sale = SaleService(db_session).create(
        SaleCreate(
            customer_id=customer.id,
            piano_id=piano.id,
            sale_date=date(2026, 8, 10),
            warranty_months=12,
        )
    )
    assert sale.serial_number is None
    updated = PianoService(db_session).get(piano.id)
    assert updated.quantity == 1
    assert updated.status == PianoStatus.AVAILABLE


def test_sale_service_converts_active_lead(db_session):
    customer = CustomerService(db_session).create(CustomerCreate(name="C Test", phone="0999888779"))
    LeadService(db_session).create(LeadCreate(customer_id=customer.id, budget_min=100, budget_max=200))
    piano = PianoService(db_session).create(
        PianoCreate(
            brand="Yamaha",
            model="U3",
            serial_number="UNIT-U3-1",
            piano_type="upright",
        )
    )

    sale = SaleService(db_session).create(
        SaleCreate(
            customer_id=customer.id,
            piano_id=piano.id,
            sale_date=date(2026, 8, 10),
            warranty_months=12,
        )
    )

    assert sale.warranty_id is not None
    lead = LeadService(db_session).repo.get_active_by_customer_id(customer.id)
    assert lead is None
    all_leads = LeadService(db_session).repo.list(search="0999888779")
    assert any(item.status == LeadStatus.CONVERTED for item in all_leads)


def test_sale_service_rolls_back_when_sale_creation_fails(db_session, monkeypatch):
    customer = CustomerService(db_session).create(CustomerCreate(name="D Test", phone="0999888780"))
    lead_service = LeadService(db_session)
    lead = lead_service.create(LeadCreate(customer_id=customer.id, budget_min=100, budget_max=200))
    piano = PianoService(db_session).create(
        PianoCreate(
            brand="Yamaha",
            model="U5",
            serial_number="UNIT-U5-1",
            piano_type="upright",
        )
    )

    def fail_create(*args, **kwargs):
        raise Exception("sale create failed")

    monkeypatch.setattr("app.repositories.sale_repository.SaleRepository.create", fail_create)

    try:
        SaleService(db_session).create(
            SaleCreate(
                customer_id=customer.id,
                piano_id=piano.id,
                sale_date=date(2026, 8, 10),
                warranty_months=12,
            )
        )
    except Exception as exc:
        assert "sale create failed" in str(exc)
    else:
        raise AssertionError("expected sale failure")

    refreshed = LeadService(db_session).repo.get_by_id(lead.id)
    assert refreshed is not None
    assert refreshed.status != LeadStatus.CONVERTED
    updated_piano = PianoService(db_session).get(piano.id)
    assert updated_piano.status == PianoStatus.AVAILABLE
