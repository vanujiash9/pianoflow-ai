"""soft delete customers"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260815_0005"
down_revision = "20260814_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "customers",
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_customers_deleted_at",
        "customers",
        ["deleted_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_customers_deleted_at", table_name="customers")
    op.drop_column("customers", "deleted_at")
