"""add piano inventory fields"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

from app.models.enums import PianoStatus, PianoType


revision = "20260810_0001"
down_revision = None
branch_labels = None
depends_on = None


PianoTypeEnum = sa.Enum(
    PianoType.UPRIGHT.value,
    PianoType.GRAND.value,
    PianoType.DIGITAL.value,
    name="pianotype",
    native_enum=False,
)
PianoStatusEnum = sa.Enum(
    PianoStatus.AVAILABLE.value,
    PianoStatus.RESERVED.value,
    PianoStatus.INCOMING.value,
    PianoStatus.SOLD.value,
    PianoStatus.PAUSED.value,
    PianoStatus.OUT_OF_STOCK.value,
    PianoStatus.SERVICE.value,
    name="pianostatus",
    native_enum=False,
)


def upgrade() -> None:
    op.add_column("pianos", sa.Column("piano_type", PianoTypeEnum, nullable=False, server_default="upright"))
    op.add_column("pianos", sa.Column("size_cm", sa.Integer(), nullable=True))
    op.add_column("pianos", sa.Column("pedal_count", sa.Integer(), nullable=True))
    op.add_column("pianos", sa.Column("purchase_price", sa.Numeric(12, 2), nullable=True))
    op.add_column("pianos", sa.Column("retail_price", sa.Numeric(12, 2), nullable=True))
    op.add_column("pianos", sa.Column("quantity", sa.Integer(), nullable=False, server_default="1"))
    op.add_column("pianos", sa.Column("variant", sa.String(length=120), nullable=True))
    op.add_column("pianos", sa.Column("arrival_date", sa.Date(), nullable=True))
    op.alter_column("pianos", "serial_number", existing_type=sa.String(length=120), nullable=True)
    op.execute("UPDATE pianos SET piano_type = 'upright' WHERE piano_type IS NULL")
    op.alter_column("pianos", "piano_type", server_default=None)
    op.alter_column("pianos", "quantity", server_default=None)
    op.alter_column("pianos", "status", existing_type=PianoStatusEnum, nullable=False)


def downgrade() -> None:
    op.alter_column("pianos", "serial_number", existing_type=sa.String(length=120), nullable=False)
    op.drop_column("pianos", "arrival_date")
    op.drop_column("pianos", "variant")
    op.drop_column("pianos", "quantity")
    op.drop_column("pianos", "retail_price")
    op.drop_column("pianos", "purchase_price")
    op.drop_column("pianos", "pedal_count")
    op.drop_column("pianos", "size_cm")
    op.drop_column("pianos", "piano_type")
