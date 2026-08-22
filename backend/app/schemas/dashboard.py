from __future__ import annotations

from datetime import date, datetime

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


class RecentDeletedCustomer(StrictModel):
    kind: str = 'customer'
    name: str
    phone: str
    deleted_at: datetime


class RecentDeletedLead(StrictModel):
    kind: str = 'lead'
    name: str
    phone: str
    deleted_at: datetime


class RecentDeletedItem(StrictModel):
    kind: str
    name: str
    phone: str
    deleted_at: datetime


class RecentDeletedCustomerWithId(StrictModel):
    id: str
    name: str
    phone: str
    deleted_at: datetime


class DashboardRead(StrictModel):
    kpis: DashboardKPI
    sales_by_month: list[MonthlySalesPoint]
    attention_items: list[AttentionItem]
    recent_customers: list[RecentCustomer]
    recent_deleted_customers: list[RecentDeletedCustomer]
    recent_deleted_leads: list[RecentDeletedLead]
    recent_deleted_items: list[RecentDeletedItem]
