from __future__ import annotations

import calendar
import uuid
from datetime import date

from sqlalchemy.orm import Session

from app.core.exceptions import BusinessRuleError, NotFoundError
from app.models.enums import PianoStatus
from app.models.warranty import Warranty
from app.repositories.customer_repository import CustomerRepository
from app.repositories.piano_repository import PianoRepository
from app.repositories.sale_repository import SaleRepository
from app.schemas.sale import SaleCreate, SaleDetail


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
        self.customers = CustomerRepository(db)
        self.pianos = PianoRepository(db)

    def list(self) -> list[SaleDetail]:
        return [self._to_detail(item) for item in self.sales.list()]

    def create(self, data: SaleCreate) -> SaleDetail:
        customer = self.customers.get(data.customer_id)
        if not customer:
            raise NotFoundError("Không tìm thấy khách hàng")
        piano = self.pianos.get(data.piano_id)
        if not piano:
            raise NotFoundError("Không tìm thấy đàn")
        if piano.status == PianoStatus.SOLD:
            raise BusinessRuleError("Đàn này đã được bán")
        if piano.serial_number is None:
            if piano.quantity <= 0:
                raise BusinessRuleError("Đàn này đã hết hàng")
            piano.quantity -= 1
            if piano.quantity == 0:
                piano.status = PianoStatus.OUT_OF_STOCK
        else:
            piano.status = PianoStatus.SOLD

        sale = self.sales.create(
            customer_id=data.customer_id,
            piano_id=data.piano_id,
            sale_date=data.sale_date,
            notes=data.notes,
        )
        warranty = Warranty(
            sale_id=sale.id,
            start_date=data.sale_date,
            end_date=_add_months(data.sale_date, data.warranty_months),
        )
        self.db.add(warranty)
        self.db.commit()
        return self._to_detail(self.sales.get(sale.id))

    @staticmethod
    def _to_detail(sale) -> SaleDetail:
        return SaleDetail(
            id=sale.id,
            customer_id=sale.customer_id,
            customer_name=sale.customer.name,
            customer_phone=sale.customer.phone,
            piano_id=sale.piano_id,
            piano_name=f"{sale.piano.brand} {sale.piano.model}",
            serial_number=sale.piano.serial_number,
            sale_date=sale.sale_date,
            warranty_end_date=sale.warranty.end_date if sale.warranty else None,
            notes=sale.notes,
        )
