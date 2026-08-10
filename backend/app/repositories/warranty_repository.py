from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.sale import Sale
from app.models.warranty import Warranty


class WarrantyRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_full(self) -> list[Warranty]:
        stmt = (
            select(Warranty)
            .options(
                joinedload(Warranty.sale).joinedload(Sale.customer),
                joinedload(Warranty.sale).joinedload(Sale.piano),
            )
            .order_by(Warranty.end_date)
        )
        return list(self.db.scalars(stmt).unique().all())

    def expiring_within(self, days: int) -> list[Warranty]:
        today = date.today()
        until = today + timedelta(days=days)
        stmt = (
            select(Warranty)
            .where(Warranty.voided_at.is_(None), Warranty.end_date >= today, Warranty.end_date <= until)
            .options(
                joinedload(Warranty.sale).joinedload(Sale.customer),
                joinedload(Warranty.sale).joinedload(Sale.piano),
            )
            .order_by(Warranty.end_date)
        )
        return list(self.db.scalars(stmt).unique().all())
