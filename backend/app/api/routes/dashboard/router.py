from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_dashboard_service
from app.schemas.dashboard import DashboardRead
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardRead)
def get_dashboard(
    service: DashboardService = Depends(get_dashboard_service),
    sales_range: int = Query(3, ge=3, le=12),
) -> DashboardRead:
    return service.get(sales_range=sales_range)
