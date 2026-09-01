from __future__ import annotations

import calendar
import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import BusinessRuleError, ConflictError, NotFoundError
from app.models.customer import Customer
from app.models.enums import LeadStatus, PianoStatus
from app.models.piano import Piano
from app.models.warranty import Warranty
from app.repositories.piano_repository import PianoRepository
from app.repositories.sale_repository import SaleRepository
from app.schemas.customer import CustomerInput
from app.schemas.sale import SaleCreate, SaleDetail, SaleUpdate
from app.services.customer_service import CustomerService
from app.services.lead_service import LeadService


def _add_months(value: date, months: int) -> date:
    month_index = value.month - 1 + months
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    day = min(value.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


class SaleService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.sales = SaleRepository(db)
        self.customers = CustomerService(db)
        self.leads = LeadService(db)
        self.pianos = PianoRepository(db)

    def list(self) -> list[SaleDetail]:
        return [self._to_detail(item) for item in self.sales.list()]

    def update(self, sale_id: uuid.UUID, data: SaleUpdate) -> SaleDetail:
        entity = self.sales.get(sale_id)
        if not entity:
            raise NotFoundError("Không tìm thấy giao dịch")
        updated = self.sales.update(entity, data)
        return self._to_detail(updated)

    def create(self, data: SaleCreate) -> SaleDetail:
        customer = self._resolve_customer(data.customer_id, data.customer)
        piano = self._resolve_piano(data.piano_id, data.serial_number)
        try:
            self._apply_inventory_sale_rules(piano)
            sale = self.sales.create(
                customer_id=customer.id,
                piano_id=piano.id,
                sale_date=data.sale_date,
                notes=data.notes,
            )
            warranty = Warranty(
                sale_id=sale.id,
                start_date=data.sale_date,
                end_date=_add_months(data.sale_date, data.warranty_months),
                notes=data.notes,
            )
            self.db.add(warranty)
            self.leads.update_status_if_active(customer.id, LeadStatus.CONVERTED)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
        return self._to_detail(self.sales.get(sale.id))

    def _resolve_customer(self, customer_id: uuid.UUID | None, customer: CustomerInput | None) -> Customer:
        if customer_id:
            entity = self.customers.repo.get(customer_id)
            if not entity:
                raise NotFoundError("Không tìm thấy khách hàng")
            return entity
        if not customer:
            raise BusinessRuleError("Phải cung cấp khách hàng hoặc customer_id")
        return self.customers.resolve_customer(
            name=customer.name,
            phone=customer.phone,
            address=customer.address,
            notes=customer.notes,
        )

    def _resolve_piano(self, piano_id: uuid.UUID | None, serial_number: str | None) -> Piano:
        if piano_id:
            entity = self.db.scalar(
                select(Piano).where(Piano.id == piano_id).with_for_update()
            )
            if not entity:
                raise NotFoundError("Không tìm thấy đàn")
            return entity
        if not serial_number:
            raise BusinessRuleError("Phải cung cấp piano_id hoặc serial_number")
        matches = list(
            self.db.scalars(
                select(Piano).where(Piano.serial_number == serial_number).with_for_update()
            ).all()
        )
        if len(matches) > 1:
            raise ConflictError("Serial đàn không xác định duy nhất")
        if not matches:
            raise NotFoundError("Không tìm thấy đàn")
        return matches[0]

    def _apply_inventory_sale_rules(self, piano: Piano) -> None:
        if piano.status != PianoStatus.AVAILABLE:
            raise BusinessRuleError("Đàn này không sẵn sàng để bán")
        if piano.serial_number is None:
            if piano.quantity <= 0:
                raise BusinessRuleError("Đàn này đã hết hàng")
            piano.quantity -= 1
            if piano.quantity == 0:
                piano.status = PianoStatus.OUT_OF_STOCK
        else:
            piano.status = PianoStatus.SOLD

    @staticmethod
    def _to_detail(sale) -> SaleDetail:
        return SaleDetail(
            id=sale.id,
            customer_id=sale.customer_id,
            customer_name=sale.customer.name,
            customer_phone=sale.customer.phone,
            customer_address=sale.customer.address,
            piano_id=sale.piano_id,
            piano_name=f"{sale.piano.brand} {sale.piano.model}",
            serial_number=sale.piano.serial_number,
            sale_date=sale.sale_date,
            warranty_id=sale.warranty.id if sale.warranty else None,
            warranty_start_date=sale.warranty.start_date if sale.warranty else None,
            warranty_end_date=sale.warranty.end_date if sale.warranty else None,
            notes=sale.notes,
        )
