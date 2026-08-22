from __future__ import annotations

import calendar
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enums import PianoCondition, PianoStatus, PianoType
from app.models.piano import Piano
from app.models.sale import Sale
from app.models.warranty import Warranty
from app.repositories.customer_repository import CustomerRepository
from app.repositories.piano_repository import PianoRepository
from app.repositories.sale_repository import SaleRepository
from app.repositories.warranty_repository import WarrantyRepository
from app.schemas.customer import CustomerInput
from app.schemas.warranty import WarrantyCreate, WarrantyDetail


def _add_months(value: date, months: int) -> date:
    month_index = value.month - 1 + months
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    day = min(value.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


class WarrantyService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = WarrantyRepository(db)
        self.sales = SaleRepository(db)
        self.customers = CustomerRepository(db)
        self.pianos = PianoRepository(db)

    def list(self) -> list[WarrantyDetail]:
        return [self._to_detail(item) for item in self.repo.list_full()]

    def expiring(self, days: int = 30) -> list[WarrantyDetail]:
        return [self._to_detail(item) for item in self.repo.expiring_within(days)]

    def create(self, payload: WarrantyCreate) -> WarrantyDetail:
        customer = self._resolve_or_create_customer(payload.customer)
        piano = self._resolve_or_create_piano(payload.piano_name, payload.serial_number)
        sale = self._create_sale(customer.id, piano.id, payload.sale_date, payload.notes)
        warranty = Warranty(
            sale_id=sale.id,
            start_date=payload.sale_date,
            end_date=_add_months(payload.sale_date, payload.warranty_months),
            notes=payload.notes,
        )
        self.repo.create(warranty)
        self.db.commit()
        fresh = self.repo.get_by_sale_id(sale.id)
        return self._to_detail(fresh or warranty)

    def _resolve_or_create_customer(self, payload_customer: CustomerInput):
        entity = self.customers.get_by_phone(payload_customer.phone)
        if entity:
            entity.name = payload_customer.name
            entity.address = payload_customer.address
            entity.notes = payload_customer.notes
            self.db.add(entity)
            self.db.flush()
            return entity

        entity = self.customers.create_entity(
            name=payload_customer.name,
            phone=payload_customer.phone,
            address=payload_customer.address,
            notes=payload_customer.notes,
        )
        self.db.flush()
        return entity

    def _resolve_or_create_piano(self, piano_name: str, serial_number: str) -> Piano:
        piano = self.pianos.get_by_serial(serial_number)
        if piano:
            return piano

        brand, model = self._split_piano_name(piano_name)
        piano = Piano(
            brand=brand,
            model=model,
            serial_number=serial_number,
            piano_type=PianoType.UPRIGHT,
            quantity=1,
            status=PianoStatus.AVAILABLE,
            condition=PianoCondition.USED,
        )
        self.db.add(piano)
        self.db.flush()
        return piano

    @staticmethod
    def _split_piano_name(piano_name: str) -> tuple[str, str]:
        cleaned = piano_name.strip()
        if not cleaned:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail='Vui lòng nhập tên đàn')
        parts = cleaned.split(None, 1)
        brand = parts[0].strip()
        model = parts[1].strip() if len(parts) > 1 else parts[0].strip()
        return brand, model

    def _create_sale(self, customer_id, piano_id, sale_date, notes):
        sale = Sale(customer_id=customer_id, piano_id=piano_id, sale_date=sale_date, notes=notes)
        self.db.add(sale)
        self.db.flush()
        return sale

    @staticmethod
    def _to_detail(item) -> WarrantyDetail:
        today = date.today()
        if item.voided_at:
            status = 'voided'
        elif item.end_date < today:
            status = 'expired'
        elif (item.end_date - today).days <= 30:
            status = 'expiring'
        else:
            status = 'active'
        return WarrantyDetail(
            id=item.id,
            sale_id=item.sale_id,
            customer_id=item.sale.customer_id,
            customer_name=item.sale.customer.name,
            customer_phone=item.sale.customer.phone,
            customer_address=item.sale.customer.address,
            piano_id=item.sale.piano_id,
            piano_name=f'{item.sale.piano.brand} {item.sale.piano.model}',
            serial_number=item.sale.piano.serial_number,
            start_date=item.start_date,
            end_date=item.end_date,
            status=status,
            days_remaining=(item.end_date - today).days,
            notes=item.notes,
        )
