"""add complaints table

Revision ID: 20260427_0008
Revises: 20260427_0007
Create Date: 2026-04-27
"""

from alembic import op
import sqlalchemy as sa

revision = "20260427_0008"
down_revision = "20260427_0007"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "complaints",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("author_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("quest_id", sa.Integer(), sa.ForeignKey("quests.id"), nullable=True),
        sa.Column("checkpoint_id", sa.Integer(), sa.ForeignKey("quest_checkpoints.id"), nullable=True),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="new"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "(quest_id IS NOT NULL AND checkpoint_id IS NULL) OR (quest_id IS NULL AND checkpoint_id IS NOT NULL)",
            name="ck_complaint_target_one_of",
        ),
    )
    op.create_index("ix_complaints_author_user_id", "complaints", ["author_user_id"], unique=False)
    op.create_index("ix_complaints_quest_id", "complaints", ["quest_id"], unique=False)
    op.create_index("ix_complaints_checkpoint_id", "complaints", ["checkpoint_id"], unique=False)
    op.create_index("ix_complaints_status", "complaints", ["status"], unique=False)
    op.create_index("ix_complaints_created_at", "complaints", ["created_at"], unique=False)


def downgrade():
    op.drop_index("ix_complaints_created_at", table_name="complaints")
    op.drop_index("ix_complaints_status", table_name="complaints")
    op.drop_index("ix_complaints_checkpoint_id", table_name="complaints")
    op.drop_index("ix_complaints_quest_id", table_name="complaints")
    op.drop_index("ix_complaints_author_user_id", table_name="complaints")
    op.drop_table("complaints")

