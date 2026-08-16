from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import CheckConstraint, Date, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin
from app.models.enums import LeadStatus


class Lead(TimestampMixin, Base):
    __tablename__ = "leads"
    __table_args__ = (
        CheckConstraint("budget_min IS NULL OR budget_min >= 0", name="ck_leads_budget_min_nonnegative"),
        CheckConstraint("budget_max IS NULL OR budget_max >= 0", name="ck_leads_budget_max_nonnegative"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    budget_min: Mapped[int | None] = mapped_column(Integer)
    budget_max: Mapped[int | None] = mapped_column(Integer)
    interested_brand: Mapped[str | None] = mapped_column(String(80))
    interested_model: Mapped[str | None] = mapped_column(String(120))
    status: Mapped[LeadStatus] = mapped_column(
        Enum(LeadStatus, native_enum=False), default=LeadStatus.NEW, nullable=False, index=True
    )
    follow_up_date: Mapped[date | None] = mapped_column(Date, index=True)
    notes: Mapped[str | None] = mapped_column(Text)

    customer = relationship("Customer", back_populates="leads")
