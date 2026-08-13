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
    connection = op.get_bind()
    rows = connection.execute(sa.text("SELECT id, phone FROM customers ORDER BY created_at, id")).fetchall()

    normalized_by_id: dict[str, str] = {}
    rows_by_phone: dict[str, list[str]] = {}
    for row in rows:
        normalized = _normalize_phone(row.phone)
        if not normalized:
            continue
        normalized_by_id[str(row.id)] = normalized
        rows_by_phone.setdefault(normalized, []).append(str(row.id))

    duplicates = {phone: ids for phone, ids in rows_by_phone.items() if len(ids) > 1}
    if duplicates:
        details = "; ".join(
            f"{phone}: {', '.join(ids)}" for phone, ids in sorted(duplicates.items())
        )
        raise RuntimeError(f"Duplicate normalized customer phones found: {details}")

    if normalized_by_id:
        for customer_id, normalized in normalized_by_id.items():
            connection.execute(
                sa.text("UPDATE customers SET phone = :phone WHERE id = :id"),
                {"id": customer_id, "phone": normalized},
            )

    op.create_unique_constraint("uq_customers_phone", "customers", ["phone"])


def downgrade() -> None:
    op.drop_constraint("uq_customers_phone", "customers", type_="unique")
