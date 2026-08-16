"""create baseline application schema"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260810_0001"
down_revision = None
branch_labels = None
depends_on = None


PIANO_TYPE_VALUES = ("upright", "grand", "digital")
PIANO_STATUS_VALUES = (
    "available",
    "reserved",
    "incoming",
    "sold",
    "paused",
    "out_of_stock",
    "service",
)
PIANO_CONDITION_VALUES = ("new", "used")
LEAD_STATUS_VALUES = ("new", "contacted", "visited", "considering", "converted", "won", "lost")
SERVICE_STATUS_VALUES = ("scheduled", "in_progress", "completed", "cancelled")
MESSAGE_ROLE_VALUES = ("user", "assistant")


def upgrade() -> None:
    op.create_table(
        "customers",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("phone", sa.String(length=30), nullable=False),
        sa.Column("address", sa.String(length=255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.UniqueConstraint("phone", name="uq_customers_phone"),
    )
    op.create_index("ix_customers_name", "customers", ["name"])
    op.create_index("ix_customers_phone", "customers", ["phone"], unique=True)

    op.create_table(
        "pianos",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("brand", sa.String(length=80), nullable=False),
        sa.Column("model", sa.String(length=120), nullable=False),
        sa.Column("year", sa.Integer(), nullable=True),
        sa.Column("serial_number", sa.String(length=120), nullable=True),
        sa.Column("piano_type", sa.Enum(*PIANO_TYPE_VALUES, name="pianotype", native_enum=False), nullable=False, server_default="upright"),
        sa.Column("size_cm", sa.Integer(), nullable=True),
        sa.Column("pedal_count", sa.Integer(), nullable=True),
        sa.Column("purchase_price", sa.Numeric(12, 2), nullable=True),
        sa.Column("retail_price", sa.Numeric(12, 2), nullable=True),
        sa.Column("status", sa.Enum(*PIANO_STATUS_VALUES, name="pianostatus", native_enum=False), nullable=False, server_default="available"),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("variant", sa.String(length=120), nullable=True),
        sa.Column("arrival_date", sa.Date(), nullable=True),
        sa.Column("color", sa.String(length=60), nullable=True),
        sa.Column("condition", sa.Enum(*PIANO_CONDITION_VALUES, name="pianocondition", native_enum=False), nullable=False, server_default="used"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("quantity >= 0", name="ck_pianos_quantity_nonnegative"),
        sa.CheckConstraint("purchase_price IS NULL OR purchase_price >= 0", name="ck_pianos_purchase_price_nonnegative"),
        sa.CheckConstraint("retail_price IS NULL OR retail_price >= 0", name="ck_pianos_retail_price_nonnegative"),
        sa.UniqueConstraint("serial_number", name="uq_pianos_serial_number"),
    )
    op.create_index("ix_pianos_brand", "pianos", ["brand"])
    op.create_index("ix_pianos_model", "pianos", ["model"])
    op.create_index("ix_pianos_serial_number", "pianos", ["serial_number"], unique=True)
    op.create_index("ix_pianos_piano_type", "pianos", ["piano_type"])
    op.create_index("ix_pianos_status", "pianos", ["status"])

    op.create_table(
        "ai_conversations",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("title", sa.String(length=160), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )

    op.create_table(
        "sales",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("customer_id", sa.String(length=36), nullable=False),
        sa.Column("piano_id", sa.String(length=36), nullable=False),
        sa.Column("sale_date", sa.Date(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["piano_id"], ["pianos.id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("piano_id", name="uq_sales_piano_id"),
    )
    op.create_index("ix_sales_customer_id", "sales", ["customer_id"])
    op.create_index("ix_sales_piano_id", "sales", ["piano_id"], unique=True)
    op.create_index("ix_sales_sale_date", "sales", ["sale_date"])

    op.create_table(
        "warranties",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("sale_id", sa.String(length=36), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("voided_at", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("end_date >= start_date", name="ck_warranties_date_order"),
        sa.ForeignKeyConstraint(["sale_id"], ["sales.id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("sale_id", name="uq_warranties_sale_id"),
    )
    op.create_index("ix_warranties_start_date", "warranties", ["start_date"])
    op.create_index("ix_warranties_end_date", "warranties", ["end_date"])

    op.create_table(
        "service_records",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("customer_id", sa.String(length=36), nullable=False),
        sa.Column("piano_id", sa.String(length=36), nullable=False),
        sa.Column("service_date", sa.Date(), nullable=False),
        sa.Column("service_type", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("next_service_date", sa.Date(), nullable=True),
        sa.Column("status", sa.Enum(*SERVICE_STATUS_VALUES, name="servicestatus", native_enum=False), nullable=False, server_default="scheduled"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("status IN ('scheduled', 'in_progress', 'completed', 'cancelled')", name="ck_service_records_status_valid"),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["piano_id"], ["pianos.id"], ondelete="RESTRICT"),
    )
    op.create_index("ix_service_records_customer_id", "service_records", ["customer_id"])
    op.create_index("ix_service_records_piano_id", "service_records", ["piano_id"])
    op.create_index("ix_service_records_service_date", "service_records", ["service_date"])
    op.create_index("ix_service_records_next_service_date", "service_records", ["next_service_date"])
    op.create_index("ix_service_records_status", "service_records", ["status"])

    op.create_table(
        "leads",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("customer_id", sa.String(length=36), nullable=False),
        sa.Column("budget_min", sa.Integer(), nullable=True),
        sa.Column("budget_max", sa.Integer(), nullable=True),
        sa.Column("interested_brand", sa.String(length=80), nullable=True),
        sa.Column("interested_model", sa.String(length=120), nullable=True),
        sa.Column("status", sa.Enum(*LEAD_STATUS_VALUES, name="leadstatus", native_enum=False), nullable=False, server_default="new"),
        sa.Column("follow_up_date", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("budget_min IS NULL OR budget_min >= 0", name="ck_leads_budget_min_nonnegative"),
        sa.CheckConstraint("budget_max IS NULL OR budget_max >= 0", name="ck_leads_budget_max_nonnegative"),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="RESTRICT"),
    )
    op.create_index("ix_leads_customer_id", "leads", ["customer_id"])
    op.create_index("ix_leads_follow_up_date", "leads", ["follow_up_date"])
    op.create_index("ix_leads_status", "leads", ["status"])
    op.create_index("uq_leads_active_customer_id", "leads", ["customer_id"], unique=True)

    op.create_table(
        "ai_messages",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("conversation_id", sa.String(length=36), nullable=False),
        sa.Column("role", sa.Enum(*MESSAGE_ROLE_VALUES, name="messagerole", native_enum=False), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["conversation_id"], ["ai_conversations.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_ai_messages_conversation_id", "ai_messages", ["conversation_id"])


def downgrade() -> None:
    raise RuntimeError("Downgrade is intentionally not supported for the baseline migration")
