"""add user role for moderation access

Revision ID: 20260427_0005
Revises: 20260427_0004
Create Date: 2026-04-27
"""

from alembic import op
import sqlalchemy as sa

revision = "20260427_0005"
down_revision = "20260427_0004"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column("role", sa.String(length=32), nullable=False, server_default="user"),
    )


def downgrade():
    op.drop_column("users", "role")
