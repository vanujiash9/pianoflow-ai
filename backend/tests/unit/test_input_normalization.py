from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.schemas.customer import CustomerCreate
from app.schemas.piano import PianoCreate


def test_piano_create_normalizes_serial_number():
    piano = PianoCreate(brand="Yamaha", model="U1", serial_number="  ab-123  ")

    assert piano.serial_number == "AB-123"


def test_customer_create_normalizes_phone_number():
    customer = CustomerCreate(name="Nguyen Van A", phone=" 090 711 1222 ")

    assert customer.phone == "0907111222"


def test_invalid_phone_is_rejected():
    with pytest.raises(ValidationError):
        CustomerCreate(name="Nguyen Van A", phone="   ")
