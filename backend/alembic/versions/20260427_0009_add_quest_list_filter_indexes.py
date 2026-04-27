"""add indexes for quest list filters

Revision ID: 20260427_0009
Revises: 20260427_0008
Create Date: 2026-04-27
"""

from alembic import op

revision = "20260427_0009"
down_revision = "20260427_0008"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index("ix_quests_duration_minutes", "quests", ["duration_minutes"], unique=False)
    op.create_index("ix_quests_difficulty", "quests", ["difficulty"], unique=False)


def downgrade():
    op.drop_index("ix_quests_difficulty", table_name="quests")
    op.drop_index("ix_quests_duration_minutes", table_name="quests")

