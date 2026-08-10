from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import BusinessRuleError, NotFoundError
from app.repositories.customer_repository import CustomerRepository
from app.repositories.piano_repository import PianoRepository
from app.repositories.service_repository import ServiceRepository
from app.schemas.service_record import (
    ServiceRecordCreate,
    ServiceRecordDetail,
    ServiceRecordRead,
    ServiceRecordUpdate,
)


class MaintenanceService:
    def __init__(self, db: Session) -> None:
        self.repo = ServiceRepository(db)
        self.customers = CustomerRepository(db)
        self.pianos = PianoRepository(db)

    def list(self) -> list[ServiceRecordDetail]:
        return [self._to_detail(item) for item in self.repo.list()]

    def due(self, days: int = 30) -> list[ServiceRecordDetail]:
        return [self._to_detail(item) for item in self.repo.due_within(days)]

    def create(self, data: ServiceRecordCreate) -> ServiceRecordRead:
        if not self.customers.get(data.customer_id):
            raise NotFoundError("Không tìm thấy khách hàng")
        piano = self.pianos.get(data.piano_id)
        if not piano:
            raise NotFoundError("Không tìm thấy đàn")
        # A service record can only be attached to a piano purchased by that customer.
        if not piano.sale or piano.sale.customer_id != data.customer_id:
            raise BusinessRuleError("Đàn không thuộc lịch sử mua của khách hàng này")
        return ServiceRecordRead.model_validate(self.repo.create(data))

    def update(self, record_id: uuid.UUID, data: ServiceRecordUpdate) -> ServiceRecordRead:
        entity = self.repo.get(record_id)
        if not entity:
            raise NotFoundError("Không tìm thấy lịch bảo trì")
        return ServiceRecordRead.model_validate(self.repo.update(entity, data))

    @staticmethod
    def _to_detail(item) -> ServiceRecordDetail:
        return ServiceRecordDetail(
            id=item.id,
            customer_name=item.customer.name,
            customer_phone=item.customer.phone,
            piano_name=f"{item.piano.brand} {item.piano.model}",
            serial_number=item.piano.serial_number,
            service_date=item.service_date,
            service_type=item.service_type,
            description=item.description,
            next_service_date=item.next_service_date,
            status=item.status,
            notes=item.notes,
        )
