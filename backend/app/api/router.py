from __future__ import annotations

from fastapi import APIRouter

from app.api.routes import ai, customers, dashboard, health, leads, pianos, sales, services, warranties

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(dashboard.router)
api_router.include_router(customers.router)
api_router.include_router(pianos.router)
api_router.include_router(sales.router)
api_router.include_router(warranties.router)
api_router.include_router(services.router)
api_router.include_router(leads.router)
api_router.include_router(ai.router)
