from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Enum, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin
from app.models.enums import PianoCondition, PianoStatus, PianoType


class Piano(TimestampMixin, Base):
    __tablename__ = "pianos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    brand: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    model: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    year: Mapped[int | None] = mapped_column(Integer)
    serial_number: Mapped[str | None] = mapped_column(String(120), unique=True, index=True)
    piano_type: Mapped[PianoType] = mapped_column(
        Enum(PianoType, native_enum=False), nullable=False, index=True
    )
    size_cm: Mapped[int | None] = mapped_column(Integer)
    pedal_count: Mapped[int | None] = mapped_column(Integer)
    purchase_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    retail_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    status: Mapped[PianoStatus] = mapped_column(
        Enum(PianoStatus, native_enum=False), default=PianoStatus.AVAILABLE, nullable=False, index=True
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    variant: Mapped[str | None] = mapped_column(String(120))
    arrival_date: Mapped[date | None] = mapped_column(Date)
    color: Mapped[str | None] = mapped_column(String(60))
    condition: Mapped[PianoCondition] = mapped_column(
        Enum(PianoCondition, native_enum=False), default=PianoCondition.USED, nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text)

    sale = relationship("Sale", back_populates="piano", uselist=False)
    services = relationship("ServiceRecord", back_populates="piano")