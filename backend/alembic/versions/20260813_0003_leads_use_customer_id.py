"""migrate leads to customer_id"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260813_0003"
down_revision = "20260813_0002"
branch_labels = None
depends_on = None

ACTIVE_STATUSES = ("new", "contacted", "visited", "considering")


def _normalize_phone(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    return cleaned or None


def upgrade() -> None:
    connection = op.get_bind()

    op.add_column("leads", sa.Column("customer_id", sa.Uuid(), nullable=True))

    customers = connection.execute(sa.text("SELECT id, phone FROM customers")).fetchall()
    customer_by_phone = {
        _normalize_phone(row.phone): str(row.id)
        for row in customers
        if _normalize_phone(row.phone)
    }

    leads = connection.execute(sa.text("SELECT id, phone FROM leads")).fetchall()
    missing: list[str] = []
    for row in leads:
        normalized = _normalize_phone(row.phone)
        customer_id = customer_by_phone.get(normalized) if normalized else None
        if not customer_id:
            missing.append(str(row.id))
            continue
        connection.execute(
            sa.text("UPDATE leads SET customer_id = :customer_id WHERE id = :id"),
            {"customer_id": customer_id, "id": str(row.id)},
        )

    if missing:
        raise RuntimeError(f"Could not backfill customer_id for leads: {', '.join(missing)}")

    op.alter_column("leads", "customer_id", existing_type=sa.Uuid(), nullable=False)
    op.create_foreign_key("fk_leads_customer_id_customers", "leads", "customers", ["customer_id"], ["id"])
    op.create_index(
        "uq_leads_active_customer_id",
        "leads",
        ["customer_id"],
        unique=True,
        postgresql_where=sa.text(f"status IN {ACTIVE_STATUSES!r}"),
        sqlite_where=sa.text(f"status IN {ACTIVE_STATUSES!r}"),
    )


def downgrade() -> None:
    op.drop_index("uq_leads_active_customer_id", table_name="leads")
    op.drop_constraint("fk_leads_customer_id_customers", "leads", type_="foreignkey")
    op.drop_column("leads", "customer_id")
