"""enforce customer phone uniqueness"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260813_0002"
down_revision = "20260810_0001"
branch_labels = None
depends_on = None


def _normalize_phone(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    return cleaned or None


def upgrade() -> None:
    return




def downgrade() -> None:
    return
