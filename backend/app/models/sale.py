from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Sale(TimestampMixin, Base):
    __tablename__ = "sales"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    piano_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("pianos.id", ondelete="RESTRICT"), nullable=False, unique=True, index=True
    )
    sale_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    notes: Mapped[str | None] = mapped_column(Text)

    customer = relationship("Customer", back_populates="sales")
    piano = relationship("Piano", back_populates="sale")
    warranty = relationship("Warranty", back_populates="sale", uselist=False, cascade="all, delete-orphan")
