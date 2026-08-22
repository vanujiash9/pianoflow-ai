from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, Response, status

from app.api.deps import get_lead_service
from app.schemas.lead import LeadCreate, LeadRead, LeadUpdate
from app.services.lead_service import LeadService

router = APIRouter(prefix="/leads", tags=["Leads"])


@router.get("", response_model=list[LeadRead])
def list_leads(
    search: str | None = Query(default=None, max_length=120),
    service: LeadService = Depends(get_lead_service),
) -> list[LeadRead]:
    return service.list(search)


@router.post("", response_model=LeadRead, status_code=status.HTTP_201_CREATED)
def create_lead(
    payload: LeadCreate,
    service: LeadService = Depends(get_lead_service),
) -> LeadRead:
    return service.create(payload)


@router.patch("/{lead_id}", response_model=LeadRead)
def update_lead(
    lead_id: uuid.UUID,
    payload: LeadUpdate,
    service: LeadService = Depends(get_lead_service),
) -> LeadRead:
    return service.update(lead_id, payload)


@router.delete(
    "/{lead_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    response_model=None,
)
def delete_lead(
    lead_id: uuid.UUID,
    service: LeadService = Depends(get_lead_service),
) -> None:
    service.delete(lead_id)
