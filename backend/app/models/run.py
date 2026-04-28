from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class RunSession(Base):
    __tablename__ = "run_sessions"
    __table_args__ = (
        CheckConstraint(
            "(user_id IS NOT NULL AND team_id IS NULL) OR "
            "(user_id IS NULL AND team_id IS NOT NULL)",
            name="ck_run_actor_choice",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    quest_id: Mapped[int] = mapped_column(ForeignKey("quests.id"), index=True)
    mode: Mapped[str] = mapped_column(String(16))
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    team_id: Mapped[int | None] = mapped_column(ForeignKey("teams.id"), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(32), default="started")
    current_checkpoint_order: Mapped[int] = mapped_column(Integer, default=1)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    score_total: Mapped[int] = mapped_column(Integer, default=0)


class RunCheckpointProgress(Base):
    __tablename__ = "run_checkpoint_progress"
    __table_args__ = (
        UniqueConstraint("run_id", "checkpoint_id", name="uq_run_checkpoint"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("run_sessions.id"), index=True)
    checkpoint_id: Mapped[int] = mapped_column(ForeignKey("quest_checkpoints.id"), index=True)
    status: Mapped[str] = mapped_column(String(16), default="locked")
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    answered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
