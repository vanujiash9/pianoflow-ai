from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.repositories.lead_repository import LeadRepository
from app.schemas.lead import LeadCreate, LeadRead, LeadUpdate


class LeadService:
    def __init__(self, db: Session) -> None:
        self.repo = LeadRepository(db)

    def list(self, search: str | None = None) -> list[LeadRead]:
        return [LeadRead.model_validate(item) for item in self.repo.list(search)]

    def create(self, data: LeadCreate) -> LeadRead:
        return LeadRead.model_validate(self.repo.create(data))

    def update(self, lead_id: uuid.UUID, data: LeadUpdate) -> LeadRead:
        entity = self.repo.get(lead_id)
        if not entity:
            raise NotFoundError("Không tìm thấy khách đang quan tâm")
        return LeadRead.model_validate(self.repo.update(entity, data))
