"""add run sessions and progress tables

Revision ID: 20260427_0004
Revises: 20260427_0003
Create Date: 2026-04-27
"""

from alembic import op
import sqlalchemy as sa

revision = "20260427_0004"
down_revision = "20260427_0003"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "run_sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("quest_id", sa.Integer(), sa.ForeignKey("quests.id"), nullable=False),
        sa.Column("mode", sa.String(length=16), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("team_id", sa.Integer(), sa.ForeignKey("teams.id"), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="started"),
        sa.Column("current_checkpoint_order", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("score_total", sa.Integer(), nullable=False, server_default="0"),
        sa.CheckConstraint(
            "(user_id IS NOT NULL AND team_id IS NULL) OR (user_id IS NULL AND team_id IS NOT NULL)",
            name="ck_run_actor_choice",
        ),
    )
    op.create_index("ix_run_sessions_quest_id", "run_sessions", ["quest_id"], unique=False)
    op.create_index("ix_run_sessions_user_id", "run_sessions", ["user_id"], unique=False)
    op.create_index("ix_run_sessions_team_id", "run_sessions", ["team_id"], unique=False)
    op.create_index(
        "ix_run_sessions_team_id_status_finished_at",
        "run_sessions",
        ["team_id", "status", "finished_at"],
        unique=False,
    )
    op.create_index(
        "ix_run_sessions_user_id_status_finished_at",
        "run_sessions",
        ["user_id", "status", "finished_at"],
        unique=False,
    )

    op.create_table(
        "run_checkpoint_progress",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("run_id", sa.Integer(), sa.ForeignKey("run_sessions.id"), nullable=False),
        sa.Column("checkpoint_id", sa.Integer(), sa.ForeignKey("quest_checkpoints.id"), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="locked"),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("answered_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("run_id", "checkpoint_id", name="uq_run_checkpoint"),
    )
    op.create_index("ix_run_checkpoint_progress_run_id", "run_checkpoint_progress", ["run_id"], unique=False)
    op.create_index(
        "ix_run_checkpoint_progress_checkpoint_id",
        "run_checkpoint_progress",
        ["checkpoint_id"],
        unique=False,
    )


def downgrade():
    op.drop_index("ix_run_checkpoint_progress_checkpoint_id", table_name="run_checkpoint_progress")
    op.drop_index("ix_run_checkpoint_progress_run_id", table_name="run_checkpoint_progress")
    op.drop_table("run_checkpoint_progress")

    op.drop_index("ix_run_sessions_user_id_status_finished_at", table_name="run_sessions")
    op.drop_index("ix_run_sessions_team_id_status_finished_at", table_name="run_sessions")
    op.drop_index("ix_run_sessions_team_id", table_name="run_sessions")
    op.drop_index("ix_run_sessions_user_id", table_name="run_sessions")
    op.drop_index("ix_run_sessions_quest_id", table_name="run_sessions")
    op.drop_table("run_sessions")
