"""add quests and quest_checkpoints tables

Revision ID: 20260427_0003
Revises: 20260427_0002
Create Date: 2026-04-27
"""

from alembic import op
import sqlalchemy as sa

revision = "20260427_0003"
down_revision = "20260427_0002"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "quests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("author_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("city_area", sa.String(length=255), nullable=False),
        sa.Column("cover_path", sa.String(length=512), nullable=True),
        sa.Column("difficulty", sa.Integer(), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("rules", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="draft"),
        sa.Column("reject_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("difficulty >= 1 AND difficulty <= 5", name="ck_quest_difficulty"),
        sa.CheckConstraint("duration_minutes > 0", name="ck_quest_duration"),
    )
    op.create_index("ix_quests_author_user_id", "quests", ["author_user_id"], unique=False)
    op.create_index("ix_quests_city_area", "quests", ["city_area"], unique=False)
    op.create_index("ix_quests_status", "quests", ["status"], unique=False)
    op.create_index("ix_quests_status_created_at", "quests", ["status", "created_at"], unique=False)

    op.create_table(
        "quest_checkpoints",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("quest_id", sa.Integer(), sa.ForeignKey("quests.id"), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lon", sa.Float(), nullable=False),
        sa.Column("task_text", sa.Text(), nullable=False),
        sa.Column("task_type", sa.String(length=32), nullable=False),
        sa.Column("codeword_answer", sa.String(length=255), nullable=True),
        sa.Column("quiz_question", sa.Text(), nullable=True),
        sa.Column("quiz_options", sa.JSON(), nullable=True),
        sa.Column("quiz_correct_index", sa.Integer(), nullable=True),
        sa.Column("hint", sa.Text(), nullable=True),
        sa.Column("safety_rules", sa.Text(), nullable=True),
        sa.UniqueConstraint("quest_id", "order_index", name="uq_quest_checkpoint_order"),
    )
    op.create_index("ix_quest_checkpoints_quest_id", "quest_checkpoints", ["quest_id"], unique=False)
    op.create_index("ix_quest_checkpoints_order_index", "quest_checkpoints", ["order_index"], unique=False)
    op.create_index(
        "ix_quest_checkpoints_quest_id_order_index",
        "quest_checkpoints",
        ["quest_id", "order_index"],
        unique=False,
    )


def downgrade():
    op.drop_index("ix_quest_checkpoints_quest_id_order_index", table_name="quest_checkpoints")
    op.drop_index("ix_quest_checkpoints_order_index", table_name="quest_checkpoints")
    op.drop_index("ix_quest_checkpoints_quest_id", table_name="quest_checkpoints")
    op.drop_table("quest_checkpoints")

    op.drop_index("ix_quests_status_created_at", table_name="quests")
    op.drop_index("ix_quests_status", table_name="quests")
    op.drop_index("ix_quests_city_area", table_name="quests")
    op.drop_index("ix_quests_author_user_id", table_name="quests")
    op.drop_table("quests")
