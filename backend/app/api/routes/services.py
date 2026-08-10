from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_maintenance_service
from app.schemas.service_record import (
    ServiceRecordCreate,
    ServiceRecordDetail,
    ServiceRecordRead,
    ServiceRecordUpdate,
)
from app.services.service_service import MaintenanceService

router = APIRouter(prefix="/services", tags=["Maintenance"])


@router.get("", response_model=list[ServiceRecordDetail])
def list_services(
    service: MaintenanceService = Depends(get_maintenance_service),
) -> list[ServiceRecordDetail]:
    return service.list()


@router.get("/due", response_model=list[ServiceRecordDetail])
def due_services(
    days: int = Query(default=30, ge=1, le=365),
    service: MaintenanceService = Depends(get_maintenance_service),
) -> list[ServiceRecordDetail]:
    return service.due(days)


@router.post("", response_model=ServiceRecordRead, status_code=status.HTTP_201_CREATED)
def create_service(
    payload: ServiceRecordCreate,
    service: MaintenanceService = Depends(get_maintenance_service),
) -> ServiceRecordRead:
    return service.create(payload)


@router.patch("/{record_id}", response_model=ServiceRecordRead)
def update_service(
    record_id: uuid.UUID,
    payload: ServiceRecordUpdate,
    service: MaintenanceService = Depends(get_maintenance_service),
) -> ServiceRecordRead:
    return service.update(record_id, payload)
