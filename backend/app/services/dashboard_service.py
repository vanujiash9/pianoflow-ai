from __future__ import annotations

from collections import OrderedDict
from datetime import date, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.customer import Customer
from app.models.enums import PianoStatus
from app.models.lead import Lead
from app.models.piano import Piano
from app.models.sale import Sale
from app.repositories.lead_repository import LeadRepository
from app.repositories.service_repository import ServiceRepository
from app.repositories.warranty_repository import WarrantyRepository
from app.schemas.dashboard import (
    AttentionItem,
    DashboardKPI,
    DashboardRead,
    MonthlySalesPoint,
    RecentCustomer,
    RecentDeletedCustomer,
    RecentDeletedItem,
    RecentDeletedLead,
)
from app.services.customer_service import CustomerService


MONTHS_VI = ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"]


def _month_start(value: date, offset: int) -> date:
    month_index = value.year * 12 + (value.month - 1) + offset
    return date(month_index // 12, month_index % 12 + 1, 1)


class DashboardService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.warranties = WarrantyRepository(db)
        self.maintenance = ServiceRepository(db)
        self.leads = LeadRepository(db)
        self.customers = CustomerService(db)

    def get(self, sales_range: int = 3) -> DashboardRead:
        today = date.today()
        month_start = today.replace(day=1)
        sales_range = max(3, min(sales_range, 12))

        months = sales_range

        if months % 3 != 0:
            months = months - (months % 3)
        if months < 3:
            months = 3

        if months > 12:
            months = 12



        available_pianos = self.db.scalar(
            select(func.count(Piano.id)).where(Piano.status == PianoStatus.AVAILABLE)
        ) or 0
        sold_this_month = self.db.scalar(
            select(func.count(Sale.id)).where(Sale.sale_date >= month_start)
        ) or 0
        total_customers = self.db.scalar(select(func.count(Customer.id))) or 0

        expiring = self.warranties.expiring_within(30)
        maintenance_due = self.maintenance.due_within(30)
        followups = self.leads.followups_within(14)
        action_items = len(expiring) + len(maintenance_due) + len(followups)

        return DashboardRead(
            kpis=DashboardKPI(
                available_pianos=available_pianos,
                sold_this_month=sold_this_month,
                total_customers=total_customers,
                action_items=action_items,
            ),
            sales_by_month=self._sales_by_month(today, months),
            attention_items=self._attention_items(expiring, maintenance_due, followups),
            recent_customers=self._recent_customers(),
            recent_deleted_customers=self._recent_deleted_customers(),
            recent_deleted_leads=self._recent_deleted_leads(),
            recent_deleted_items=self._recent_deleted_items(),
        )

    def _sales_by_month(self, today: date, months: int) -> list[MonthlySalesPoint]:
        starts = [_month_start(today, offset) for offset in range(-(months - 1), 1)]
        first = starts[0]
        counts: OrderedDict[tuple[int, int], int] = OrderedDict(
            ((item.year, item.month), 0) for item in starts
        )
        year_expr = func.extract("year", Sale.sale_date)
        month_expr = func.extract("month", Sale.sale_date)
        rows = self.db.execute(
            select(
                year_expr.label("year"),
                month_expr.label("month"),
                func.count(Sale.id).label("count"),
            )
            .where(Sale.sale_date >= first)
            .group_by(year_expr, month_expr)
        )
        for row in rows:
            key = (int(row.year), int(row.month))
            if key in counts:
                counts[key] = int(row.count)
        return [
            MonthlySalesPoint(month=f"{MONTHS_VI[month - 1]}/{str(year)[-2:]}", count=count)
            for (year, month), count in counts.items()
        ]

    @staticmethod
    def _attention_items(expiring, maintenance_due, followups) -> list[AttentionItem]:
        items: list[AttentionItem] = []
        for warranty in expiring[:4]:
            items.append(
                AttentionItem(
                    type="warranty",
                    title=f"{warranty.sale.customer.name} · {warranty.sale.piano.brand} {warranty.sale.piano.model}",
                    subtitle="Bảo hành sắp hết hạn",
                    due_date=warranty.end_date,
                    priority="high" if (warranty.end_date - date.today()).days <= 7 else "medium",
                )
            )
        for record in maintenance_due[:4]:
            items.append(
                AttentionItem(
                    type="service",
                    title=f"{record.customer.name} · {record.piano.brand} {record.piano.model}",
                    subtitle="Đến lịch bảo trì",
                    due_date=record.next_service_date,
                    priority="medium",
                )
            )
        for lead in followups[:4]:
            items.append(
                AttentionItem(
                    type="lead",
                    title=f"{lead.customer.name} · {lead.interested_brand or 'Chưa rõ hãng'}",
                    subtitle="Cần chăm sóc khách đang quan tâm",
                    due_date=lead.follow_up_date,
                    priority="low",
                )
            )
        items.sort(key=lambda item: item.due_date or date.max)
        return items[:8]

    def _recent_customers(self) -> list[RecentCustomer]:
        stmt = (
            select(Customer)
            .where(Customer.deleted_at.is_(None))
            .options(joinedload(Customer.sales).joinedload(Sale.piano), joinedload(Customer.sales).joinedload(Sale.warranty))
            .order_by(Customer.created_at.desc())
            .limit(6)
        )
        customers = list(self.db.scalars(stmt).unique().all())
        output: list[RecentCustomer] = []
        today = date.today()
        for customer in customers:
            latest = max(customer.sales, key=lambda sale: sale.sale_date, default=None)
            warranty_status = None
            if latest and latest.warranty:
                warranty_status = "Còn hạn" if latest.warranty.end_date >= today else "Hết hạn"
            output.append(
                RecentCustomer(
                    name=customer.name,
                    phone=customer.phone,
                    last_piano=f"{latest.piano.brand} {latest.piano.model}" if latest else None,
                    last_purchase_date=latest.sale_date if latest else None,
                    warranty_status=warranty_status,
                )
            )
        return output

    def _recent_deleted_customers(self) -> list[RecentDeletedCustomer]:
        rows = self.db.scalars(
            select(Customer)
            .where(Customer.deleted_at.is_not(None))
            .order_by(Customer.deleted_at.desc())
            .limit(6)
        ).all()
        return [
            RecentDeletedCustomer(
                name=item.name,
                phone=item.phone,
                deleted_at=item.deleted_at or datetime.combine(date.today(), datetime.min.time()),
            )
            for item in rows
        ]

    def _recent_deleted_leads(self) -> list[RecentDeletedLead]:
        rows = self.db.scalars(
            select(Lead)
            .where(Lead.deleted_at.is_not(None))
            .options(joinedload(Lead.customer))
            .order_by(Lead.deleted_at.desc())
            .limit(6)
        ).all()
        return [
            RecentDeletedLead(
                name=item.customer.name,
                phone=item.customer.phone,
                deleted_at=item.deleted_at or datetime.combine(date.today(), datetime.min.time()),
            )
            for item in rows
        ]

    def _recent_deleted_items(self) -> list[RecentDeletedItem]:
        items = [
            RecentDeletedItem(kind="customer", name=item.name, phone=item.phone, deleted_at=item.deleted_at)
            for item in self.db.scalars(
                select(Customer)
                .where(Customer.deleted_at.is_not(None))
                .order_by(Customer.deleted_at.desc())
                .limit(6)
            ).all()
        ]
        items.extend(
            RecentDeletedItem(kind="lead", name=item.customer.name, phone=item.customer.phone, deleted_at=item.deleted_at)
            for item in self.db.scalars(
                select(Lead)
                .where(Lead.deleted_at.is_not(None))
                .options(joinedload(Lead.customer))
                .order_by(Lead.deleted_at.desc())
                .limit(6)
            ).all()
        )
        items.sort(key=lambda item: item.deleted_at)
        return items[-6:][::-1]
