from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import CheckConstraint, Date, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin
from app.models.enums import ServiceStatus


class ServiceRecord(TimestampMixin, Base):
    __tablename__ = "service_records"
    __table_args__ = (
        CheckConstraint(
            "status IN ('scheduled', 'in_progress', 'completed', 'cancelled')",
            name="ck_service_records_status_valid",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    piano_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("pianos.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    service_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    service_type: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    next_service_date: Mapped[date | None] = mapped_column(Date, index=True)
    status: Mapped[ServiceStatus] = mapped_column(
        Enum(ServiceStatus, native_enum=False, values_callable=lambda enum_cls: [item.value for item in enum_cls]),
        default=ServiceStatus.SCHEDULED,
        nullable=False,
        index=True,
    )
    notes: Mapped[str | None] = mapped_column(Text)

    customer = relationship("Customer", back_populates="services")
    piano = relationship("Piano", back_populates="services")
