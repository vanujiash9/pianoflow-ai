from __future__ import annotations

from datetime import date

from app.models.enums import PianoStatus
from app.schemas.customer import CustomerCreate
from app.schemas.piano import PianoCreate
from app.schemas.sale import SaleCreate
from app.services.customer_service import CustomerService
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
