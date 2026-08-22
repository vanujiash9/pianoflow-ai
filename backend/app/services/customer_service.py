from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.repositories.customer_repository import CustomerRepository
from app.repositories.sale_repository import SaleRepository
from app.repositories.service_repository import ServiceRepository
from app.schemas.common import normalize_phone_number
from app.schemas.customer import (
    CustomerCreate,
    CustomerProfile,
    CustomerPurchaseSummary,
    CustomerRead,
    CustomerServiceSummary,
    CustomerUpdate,
)


class CustomerService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = CustomerRepository(db)
        self.sales = SaleRepository(db)
        self.services = ServiceRepository(db)

    def list(self, search: str | None = None) -> list[CustomerRead]:
        return [CustomerRead.model_validate(item) for item in self.repo.list(search)]

    def get(self, customer_id: uuid.UUID) -> CustomerRead:
        entity = self.repo.get(customer_id)
        if not entity:
            raise NotFoundError("Không tìm thấy khách hàng")
        return CustomerRead.model_validate(entity)

    def profile(self, customer_id: uuid.UUID) -> CustomerProfile:
        entity = self.repo.get(customer_id)
        if not entity:
            raise NotFoundError("Không tìm thấy khách hàng")
        today = date.today()
        purchases = []
        for sale in self.sales.list_by_customer(customer_id):
            if not sale.warranty:
                warranty_status = None
            elif sale.warranty.end_date < today:
                warranty_status = "expired"
            elif (sale.warranty.end_date - today).days <= 30:
                warranty_status = "expiring"
            else:
                warranty_status = "active"
            purchases.append(
                CustomerPurchaseSummary(
                    piano_id=sale.piano_id,
                    piano_name=f"{sale.piano.brand} {sale.piano.model}",
                    serial_number=sale.piano.serial_number,
                    sale_date=sale.sale_date.isoformat(),
                    warranty_end_date=(
                        sale.warranty.end_date.isoformat() if sale.warranty else None
                    ),
                    warranty_status=warranty_status,
                )
            )
        service_items = [
            CustomerServiceSummary(
                piano_name=f"{item.piano.brand} {item.piano.model}",
                service_date=item.service_date.isoformat(),
                service_type=item.service_type,
                next_service_date=(
                    item.next_service_date.isoformat() if item.next_service_date else None
                ),
                status=item.status.value,
            )
            for item in self.services.list_by_customer(customer_id)
        ]
        return CustomerProfile(
            customer=CustomerRead.model_validate(entity),
            purchases=purchases,
            services=service_items,
        )

    def resolve_customer(
        self,
        *,
        name: str,
        phone: str,
        address: str | None = None,
        notes: str | None = None,
    ):
        normalized_phone = normalize_phone_number(phone)
        if not normalized_phone:
            raise ConflictError("Số điện thoại đã tồn tại")

        entity = self.repo.get_by_phone(normalized_phone, include_deleted=True)
        if entity:
            if entity.deleted_at is not None:
                entity = self.repo.restore(
                    entity,
                    name=name,
                    phone=normalized_phone,
                    address=address,
                    notes=notes,
                )
            return entity

        entity = self.repo.create_entity(
            name=name,
            phone=normalized_phone,
            address=address,
            notes=notes,
        )
        try:
            self.db.flush()
        except IntegrityError as exc:
            self.db.rollback()
            existing = self.repo.get_by_phone(normalized_phone)
            if existing:
                return existing
            raise ConflictError("Số điện thoại đã tồn tại") from exc
        return entity

    def create(self, data: CustomerCreate) -> CustomerRead:
        try:
            customer = self.resolve_customer(
                name=data.name,
                phone=data.phone,
                address=data.address,
                notes=data.notes,
            )
            self.db.commit()
            self.db.refresh(customer)
            return CustomerRead.model_validate(customer)
        except IntegrityError as exc:
            self.db.rollback()
            raise ConflictError("Không thể tạo khách hàng do dữ liệu bị trùng") from exc

    def update(self, customer_id: uuid.UUID, data: CustomerUpdate) -> CustomerRead:
        entity = self.repo.get(customer_id)
        if not entity:
            raise NotFoundError("Không tìm thấy khách hàng")
        if data.phone and data.phone != entity.phone and self.repo.get_by_phone(data.phone):
            raise ConflictError("Số điện thoại đã tồn tại")
        if data.phone and data.phone != entity.phone and self.repo.get_by_phone(data.phone, include_deleted=True):
            raise ConflictError("Số điện thoại đã tồn tại")
        updated = self.repo.update(entity, data)
        self.db.commit()
        self.db.refresh(updated)
        return CustomerRead.model_validate(updated)

    def delete(self, customer_id: uuid.UUID) -> None:
        entity = self.repo.get(customer_id)
        if not entity:
            raise NotFoundError("Không tìm thấy khách hàng")
        self.repo.soft_delete(entity)
        self.db.commit()

    def recent_deleted(self, limit: int = 5):
        return self.repo.list_deleted_recent(limit)
