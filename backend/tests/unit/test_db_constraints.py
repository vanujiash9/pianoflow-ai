from __future__ import annotations

from datetime import date

import pytest
from sqlalchemy.exc import IntegrityError

from app.models.customer import Customer
from app.models.piano import Piano
from app.models.sale import Sale
from app.models.warranty import Warranty
from app.models.service_record import ServiceRecord
from app.models.enums import PianoCondition, PianoStatus, PianoType, ServiceStatus


def test_piano_rejects_negative_quantity(db_session):
    piano = Piano(
        brand="Yamaha",
        model="U1",
        piano_type=PianoType.UPRIGHT,
        status=PianoStatus.AVAILABLE,
        quantity=-1,
        condition=PianoCondition.USED,
    )
    db_session.add(piano)
    with pytest.raises(IntegrityError):
        db_session.commit()


def test_warranty_rejects_reverse_dates(db_session):
    customer = Customer(name="Khách", phone="0909000999")
    db_session.add(customer)
    db_session.flush()
    piano = Piano(
        brand="Kawai",
        model="K-300",
        piano_type=PianoType.UPRIGHT,
        status=PianoStatus.AVAILABLE,
        quantity=1,
        condition=PianoCondition.USED,
    )
    db_session.add(piano)
    db_session.flush()
    sale = Sale(customer_id=customer.id, piano_id=piano.id, sale_date=date(2026, 8, 10))
    db_session.add(sale)
    db_session.flush()
    warranty = Warranty(
        sale_id=sale.id,
        start_date=date(2026, 8, 10),
        end_date=date(2026, 8, 1),
    )
    db_session.add(warranty)
    with pytest.raises(IntegrityError):
        db_session.commit()


def test_service_record_requires_valid_status(db_session):
    customer = Customer(name="Khách", phone="0909000998")
    piano = Piano(
        brand="Kawai",
        model="K-300",
        piano_type=PianoType.UPRIGHT,
        status=PianoStatus.AVAILABLE,
        quantity=1,
        condition=PianoCondition.USED,
    )
    db_session.add_all([customer, piano])
    db_session.flush()
    record = ServiceRecord(
        customer_id=customer.id,
        piano_id=piano.id,
        service_date=date(2026, 8, 10),
        service_type="Tuning",
        status=ServiceStatus.SCHEDULED.value,
    )
    db_session.add(record)
    db_session.commit()
    assert record.status == ServiceStatus.SCHEDULED.value


def test_customer_phone_unique_is_enforced(db_session):
    first = Customer(name="Khách", phone="0909000997")
    second = Customer(name="Khách 2", phone="0909000997")
    db_session.add_all([first, second])
    with pytest.raises(IntegrityError):
        db_session.commit()
