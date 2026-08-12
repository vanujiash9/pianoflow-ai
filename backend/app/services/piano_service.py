from __future__ import annotations

import uuid
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models.enums import PianoStatus
from app.repositories.piano_repository import PianoRepository
from app.schemas.piano import PianoCreate, PianoRead, PianoUpdate


class PianoService:
    def __init__(self, db: Session) -> None:
        self.repo = PianoRepository(db)

    def list(self, search: str | None = None, status: PianoStatus | None = None) -> list[PianoRead]:
        return [PianoRead.model_validate(item) for item in self.repo.list(search, status)]

    def get(self, piano_id: uuid.UUID) -> PianoRead:
        entity = self.repo.get(piano_id)
        if not entity:
            raise NotFoundError("Không tìm thấy đàn")
        return PianoRead.model_validate(entity)

    def create(self, data: PianoCreate) -> PianoRead:
        serial_number = data.serial_number
        if serial_number and self.repo.get_by_serial(serial_number):
            raise ConflictError("Serial đàn đã tồn tại")
        try:
            return PianoRead.model_validate(self.repo.create(data))
        except IntegrityError as exc:
            raise ConflictError("Không thể tạo đàn do dữ liệu bị trùng") from exc

    def update(self, piano_id: uuid.UUID, data: PianoUpdate) -> PianoRead:
        entity = self.repo.get(piano_id)
        if not entity:
            raise NotFoundError("Không tìm thấy đàn")
        if data.serial_number and data.serial_number != entity.serial_number:
            if self.repo.get_by_serial(data.serial_number):
                raise ConflictError("Serial đàn đã tồn tại")
        return PianoRead.model_validate(self.repo.update(entity, data))
