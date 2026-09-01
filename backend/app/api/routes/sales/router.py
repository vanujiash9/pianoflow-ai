from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, status

from app.api.deps import get_sale_service
from app.schemas.sale import SaleCreate, SaleDetail, SaleUpdate
from app.services.sale_service import SaleService

router = APIRouter(prefix="/sales", tags=["Sales"])


@router.get("", response_model=list[SaleDetail])
def list_sales(service: SaleService = Depends(get_sale_service)) -> list[SaleDetail]:
    return service.list()


@router.post("", response_model=SaleDetail, status_code=status.HTTP_201_CREATED)
def create_sale(
    payload: SaleCreate,
    service: SaleService = Depends(get_sale_service),
) -> SaleDetail:
    return service.create(payload)


@router.patch("/{sale_id}", response_model=SaleDetail)
def update_sale(
    sale_id: uuid.UUID,
    payload: SaleUpdate,
    service: SaleService = Depends(get_sale_service),
) -> SaleDetail:
    return service.update(sale_id, payload)
