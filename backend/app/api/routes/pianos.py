from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_piano_service
from app.models.enums import PianoStatus
from app.schemas.piano import PianoCreate, PianoRead, PianoUpdate
from app.services.piano_service import PianoService

router = APIRouter(prefix="/pianos", tags=["Pianos"])


@router.get("", response_model=list[PianoRead])
def list_pianos(
    search: str | None = Query(default=None, max_length=120),
    piano_status: PianoStatus | None = Query(default=None, alias="status"),
    service: PianoService = Depends(get_piano_service),
) -> list[PianoRead]:
    return service.list(search, piano_status)


@router.get("/{piano_id}", response_model=PianoRead)
def get_piano(
    piano_id: uuid.UUID,
    service: PianoService = Depends(get_piano_service),
) -> PianoRead:
    return service.get(piano_id)


@router.post("", response_model=PianoRead, status_code=status.HTTP_201_CREATED)
def create_piano(
    payload: PianoCreate,
    service: PianoService = Depends(get_piano_service),
) -> PianoRead:
    return service.create(payload)


@router.patch("/{piano_id}", response_model=PianoRead)
def update_piano(
    piano_id: uuid.UUID,
    payload: PianoUpdate,
    service: PianoService = Depends(get_piano_service),
) -> PianoRead:
    return service.update(piano_id, payload)
