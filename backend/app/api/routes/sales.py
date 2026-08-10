from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.api.deps import get_sale_service
from app.schemas.sale import SaleCreate, SaleDetail
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
