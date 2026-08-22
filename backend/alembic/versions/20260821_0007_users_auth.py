"""add users auth table"""

from __future__ import annotations

import os

from alembic import op
import sqlalchemy as sa

from app.utils.auth import hash_password

revision = "20260821_0007"
down_revision = "20260816_0006"
branch_labels = None
depends_on = None


DEFAULT_USERNAME = os.getenv("AUTH_SEED_USERNAME", "admin")
DEFAULT_PASSWORD = os.getenv("AUTH_SEED_PASSWORD", "admin12345")
DEFAULT_ROLE = os.getenv("AUTH_SEED_ROLE", "admin")


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("username", sa.String(length=80), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_username", "users", ["username"], unique=True)

    users = sa.table(
        "users",
        sa.column("id", sa.Uuid()),
        sa.column("username", sa.String()),
        sa.column("password_hash", sa.Text()),
        sa.column("role", sa.String()),
        sa.column("is_active", sa.Boolean()),
    )
    op.bulk_insert(
        users,
        [
            {
                "id": "11111111-1111-1111-1111-111111111111",
                "username": DEFAULT_USERNAME,
                "password_hash": hash_password(DEFAULT_PASSWORD),
                "role": DEFAULT_ROLE,
                "is_active": True,
            }
        ],
    )


def downgrade() -> None:
    op.drop_index("ix_users_username", table_name="users")
    op.drop_table("users")
