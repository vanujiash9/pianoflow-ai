from __future__ import annotations

import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models.enums import LeadStatus
from app.repositories.lead_repository import LeadRepository
from app.schemas.lead import ACTIVE_LEAD_STATUSES, LeadCreate, LeadRead, LeadUpdate
from app.services.customer_service import CustomerService


class LeadService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = LeadRepository(db)
        self.customers = CustomerService(db)

    def list(self, search: str | None = None) -> list[LeadRead]:
        return [self._to_read(item) for item in self.repo.list(search)]

    def create(self, data: LeadCreate) -> LeadRead:
        customer = self._resolve_customer(data)
        self._ensure_no_active_lead(customer.id)
        entity = self.repo.create(customer_id=customer.id, data=data)
        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise ConflictError("Khách này đã có trong danh sách khách quan tâm.") from exc
        return self._to_read(self.repo.get_by_id(entity.id) or entity)

    def update(self, lead_id: uuid.UUID, data: LeadUpdate) -> LeadRead:
        entity = self.repo.get_by_id(lead_id)
        if not entity:
            raise NotFoundError("Không tìm thấy khách đang quan tâm")
        if data.customer_id or data.customer:
            raise ConflictError("Không thể đổi khách hàng của lead đã tồn tại")
        if data.status and data.status in ACTIVE_LEAD_STATUSES and data.status != entity.status:
            self._ensure_no_active_lead(entity.customer_id, exclude_id=entity.id)
        updated = self.repo.update(entity, data)
        self.db.commit()
        return self._to_read(self.repo.get_by_id(updated.id) or updated)

    def delete(self, lead_id: uuid.UUID) -> None:
        entity = self.repo.get_by_id(lead_id)
        if not entity:
            raise NotFoundError("Không tìm thấy khách đang quan tâm")
        self.repo.soft_delete(entity)
        self.db.commit()
        self.db.refresh(entity)
        self.customers.recent_deleted(1)

    def update_status_if_active(self, customer_id: uuid.UUID, status: LeadStatus) -> None:
        entity = self.repo.get_active_by_customer_id(customer_id)
        if not entity:
            return
        self.repo.update_status(entity, status)

    def convert_customer_lead(self, customer_id: uuid.UUID) -> None:
        self.update_status_if_active(customer_id, LeadStatus.CONVERTED)

    def _resolve_customer(self, data: LeadCreate):
        if data.customer_id:
            entity = self.customers.repo.get(data.customer_id)
            if not entity:
                raise NotFoundError("Không tìm thấy khách hàng")
            return entity
        if not data.customer:
            raise ConflictError("Phải cung cấp khách hàng hoặc customer_id")
        return self.customers.resolve_customer(
            name=data.customer.name,
            phone=data.customer.phone,
            address=data.customer.address,
            notes=data.customer.notes,
        )

    def _to_read(self, entity) -> LeadRead:
        return LeadRead(
            id=entity.id,
            customer_id=entity.customer_id,
            customer={
                "id": entity.customer.id,
                "name": entity.customer.name,
                "phone": entity.customer.phone,
                "address": entity.customer.address,
            },
            budget_min=entity.budget_min,
            budget_max=entity.budget_max,
            interested_brand=entity.interested_brand,
            interested_model=entity.interested_model,
            status=entity.status,
            follow_up_date=entity.follow_up_date,
            notes=entity.notes,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )

    def _ensure_no_active_lead(self, customer_id: uuid.UUID, *, exclude_id: uuid.UUID | None = None) -> None:
        existing = self.repo.get_active_by_customer_id(customer_id, exclude_id=exclude_id)
        if existing:
            raise ConflictError("Khách này đã có trong danh sách khách quan tâm.")
