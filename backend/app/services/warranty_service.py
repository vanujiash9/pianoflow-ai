from __future__ import annotations

from datetime import date

from sqlalchemy.orm import Session

from app.repositories.warranty_repository import WarrantyRepository
from app.schemas.warranty import WarrantyDetail


class WarrantyService:
    def __init__(self, db: Session) -> None:
        self.repo = WarrantyRepository(db)

    def list(self) -> list[WarrantyDetail]:
        return [self._to_detail(item) for item in self.repo.list_full()]

    def expiring(self, days: int = 30) -> list[WarrantyDetail]:
        return [self._to_detail(item) for item in self.repo.expiring_within(days)]

    @staticmethod
    def _to_detail(item) -> WarrantyDetail:
        today = date.today()
        if item.voided_at:
            status = "voided"
        elif item.end_date < today:
            status = "expired"
        elif (item.end_date - today).days <= 30:
            status = "expiring"
        else:
            status = "active"
        return WarrantyDetail(
            id=item.id,
            sale_id=item.sale_id,
            customer_id=item.sale.customer_id,
            customer_name=item.sale.customer.name,
            customer_phone=item.sale.customer.phone,
            customer_address=item.sale.customer.address,
            piano_id=item.sale.piano_id,
            piano_name=f"{item.sale.piano.brand} {item.sale.piano.model}",
            serial_number=item.sale.piano.serial_number,
            start_date=item.start_date,
            end_date=item.end_date,
            status=status,
            days_remaining=(item.end_date - today).days,
            notes=item.notes,
        )
