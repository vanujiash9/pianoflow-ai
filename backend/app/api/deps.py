from __future__ import annotations

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.ai_service import AIService
from app.services.customer_service import CustomerService
from app.services.dashboard_service import DashboardService
from app.services.lead_service import LeadService
from app.services.piano_service import PianoService
from app.services.sale_service import SaleService
from app.services.service_service import MaintenanceService
from app.services.warranty_service import WarrantyService


def get_customer_service(db: Session = Depends(get_db)) -> CustomerService:
    return CustomerService(db)


def get_piano_service(db: Session = Depends(get_db)) -> PianoService:
    return PianoService(db)


def get_sale_service(db: Session = Depends(get_db)) -> SaleService:
    return SaleService(db)


def get_warranty_service(db: Session = Depends(get_db)) -> WarrantyService:
    return WarrantyService(db)


def get_maintenance_service(db: Session = Depends(get_db)) -> MaintenanceService:
    return MaintenanceService(db)


def get_lead_service(db: Session = Depends(get_db)) -> LeadService:
    return LeadService(db)


def get_dashboard_service(db: Session = Depends(get_db)) -> DashboardService:
    return DashboardService(db)


def get_ai_service(db: Session = Depends(get_db)) -> AIService:
    return AIService(db)
