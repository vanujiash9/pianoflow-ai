from __future__ import annotations

from fastapi import APIRouter

from app.api.routes.ai.router import router as ai_router
from app.api.routes.customers.router import router as customers_router
from app.api.routes.dashboard.router import router as dashboard_router
from app.api.routes.health import router as health_router
from app.api.routes.leads.router import router as leads_router
from app.api.routes.pianos.router import router as pianos_router
from app.api.routes.sales.router import router as sales_router
from app.api.routes.services.router import router as services_router
from app.api.routes.warranties.router import router as warranties_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(dashboard_router)
api_router.include_router(customers_router)
api_router.include_router(pianos_router)
api_router.include_router(sales_router)
api_router.include_router(warranties_router)
api_router.include_router(services_router)
api_router.include_router(leads_router)
api_router.include_router(ai_router)
