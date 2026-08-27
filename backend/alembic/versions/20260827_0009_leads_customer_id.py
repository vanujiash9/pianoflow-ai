"""add leads customer_id and backfill from legacy columns"""

from __future__ import annotations

from uuid import uuid4

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect, text

revision = "20260827_0009"
down_revision = "20260827_0008"
branch_labels = None
depends_on = None


def _has_column(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    return column_name in {column["name"] for column in inspect(bind).get_columns(table_name)}


def _has_index(table_name: str, index_name: str) -> bool:
    bind = op.get_bind()
    return index_name in {index["name"] for index in inspect(bind).get_indexes(table_name)}


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == "postgresql":
        if not _has_column("leads", "customer_id"):
            op.add_column("leads", sa.Column("customer_id", sa.Uuid(), nullable=True))
        if not _has_index("leads", "ix_leads_customer_id"):
            op.create_index("ix_leads_customer_id", "leads", ["customer_id"], unique=False)

        rows = list(
            bind.execute(
                text(
                    "SELECT id, customer_name, phone, created_at, updated_at FROM leads WHERE customer_id IS NULL ORDER BY created_at"
                )
            )
        )
        for lead_id, customer_name, phone, created_at, updated_at in rows:
            customer_id = bind.execute(
                text(
                    "SELECT id FROM customers WHERE phone = :phone OR lower(name) = lower(:name) ORDER BY created_at DESC LIMIT 1"
                ),
                {"phone": phone, "name": customer_name or ""},
            ).scalar()
            if customer_id is None:
                customer_id = uuid4()
                bind.execute(
                    text(
                        "INSERT INTO customers (id, name, phone, address, notes, created_at, updated_at, deleted_at) VALUES (:id, :name, :phone, NULL, NULL, :created_at, :updated_at, NULL)"
                    ),
                    {
                        "id": customer_id,
                        "name": customer_name or "Khách cũ",
                        "phone": phone,
                        "created_at": created_at,
                        "updated_at": updated_at,
                    },
                )
            bind.execute(
                text("UPDATE leads SET customer_id = :customer_id WHERE id = :lead_id"),
                {"customer_id": customer_id, "lead_id": lead_id},
            )

        op.execute(text("DELETE FROM leads WHERE customer_id IS NULL"))
        op.execute(text("ALTER TABLE leads ALTER COLUMN customer_id SET NOT NULL"))
        op.execute(text("ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_customer_id_fkey"))
        op.execute(
            text(
                "ALTER TABLE leads ADD CONSTRAINT leads_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT"
            )
        )
        return

    if dialect == "sqlite":
        if not _has_column("leads", "customer_id"):
            op.add_column("leads", sa.Column("customer_id", sa.Uuid(), nullable=True))
        if not _has_index("leads", "ix_leads_customer_id"):
            op.create_index("ix_leads_customer_id", "leads", ["customer_id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == "postgresql":
        op.execute(text("ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_customer_id_fkey"))
        if _has_index("leads", "ix_leads_customer_id"):
            op.drop_index("ix_leads_customer_id", table_name="leads")
        if _has_column("leads", "customer_id"):
            op.drop_column("leads", "customer_id")
        return

    if dialect == "sqlite":
        if _has_index("leads", "ix_leads_customer_id"):
            op.drop_index("ix_leads_customer_id", table_name="leads")
        if _has_column("leads", "customer_id"):
            op.drop_column("leads", "customer_id")
