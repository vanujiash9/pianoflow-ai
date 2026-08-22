from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_warranty_service
from app.schemas.warranty import WarrantyCreate, WarrantyDetail
from app.services.warranty_service import WarrantyService

router = APIRouter(prefix="/warranties", tags=["Warranties"])


@router.get("", response_model=list[WarrantyDetail])
def list_warranties(service: WarrantyService = Depends(get_warranty_service)) -> list[WarrantyDetail]:
    return service.list()


@router.get("/expiring", response_model=list[WarrantyDetail])
def expiring_warranties(
    days: int = Query(default=30, ge=1, le=365),
    service: WarrantyService = Depends(get_warranty_service),
) -> list[WarrantyDetail]:
    return service.expiring(days)


@router.post("", response_model=WarrantyDetail, status_code=status.HTTP_201_CREATED)
def create_warranty(
    payload: WarrantyCreate,
    service: WarrantyService = Depends(get_warranty_service),
) -> WarrantyDetail:
    return service.create(payload)
