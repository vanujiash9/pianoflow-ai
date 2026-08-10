from __future__ import annotations

from datetime import date

from app.schemas.common import StrictModel


class DashboardKPI(StrictModel):
    available_pianos: int
    sold_this_month: int
    total_customers: int
    action_items: int


class MonthlySalesPoint(StrictModel):
    month: str
    count: int


class AttentionItem(StrictModel):
    type: str
    title: str
    subtitle: str
    due_date: date | None
    priority: str


class RecentCustomer(StrictModel):
    name: str
    phone: str
    last_piano: str | None
    last_purchase_date: date | None
    warranty_status: str | None


class DashboardRead(StrictModel):
    kpis: DashboardKPI
    sales_by_month: list[MonthlySalesPoint]
    attention_items: list[AttentionItem]
    recent_customers: list[RecentCustomer]
