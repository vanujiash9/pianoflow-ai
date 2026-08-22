"""soft delete leads"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260816_0006"
down_revision = "20260815_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "leads",
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_leads_deleted_at",
        "leads",
        ["deleted_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_leads_deleted_at", table_name="leads")
    op.drop_column("leads", "deleted_at")
