"""add user profile fields (nickname, age_group)

Revision ID: 20260427_0007
Revises: 20260427_0006
Create Date: 2026-04-27
"""

from alembic import op
import sqlalchemy as sa

revision = "20260427_0007"
down_revision = "20260427_0006"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("nickname", sa.String(length=32), nullable=True))
    op.add_column("users", sa.Column("age_group", sa.String(length=8), nullable=True))

    op.create_index("ix_users_nickname", "users", ["nickname"], unique=True)


def downgrade():
    op.drop_index("ix_users_nickname", table_name="users")
    op.drop_column("users", "age_group")
    op.drop_column("users", "nickname")

