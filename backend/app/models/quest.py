from datetime import datetime

from sqlalchemy import (
    JSON,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Quest(Base):
    __tablename__ = "quests"
    __table_args__ = (
        CheckConstraint("difficulty >= 1 AND difficulty <= 5", name="ck_quest_difficulty"),
        CheckConstraint("duration_minutes > 0", name="ck_quest_duration"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    author_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    city_area: Mapped[str] = mapped_column(String(255), index=True)
    cover_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    difficulty: Mapped[int] = mapped_column(Integer)
    duration_minutes: Mapped[int] = mapped_column(Integer)
    rules: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="draft", index=True)
    reject_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class QuestCheckpoint(Base):
    __tablename__ = "quest_checkpoints"
    __table_args__ = (
        UniqueConstraint("quest_id", "order_index", name="uq_quest_checkpoint_order"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    quest_id: Mapped[int] = mapped_column(ForeignKey("quests.id"), index=True)
    order_index: Mapped[int] = mapped_column(Integer, index=True)
    title: Mapped[str] = mapped_column(String(255))
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    task_text: Mapped[str] = mapped_column(Text)
    task_type: Mapped[str] = mapped_column(String(32))
    codeword_answer: Mapped[str | None] = mapped_column(String(255), nullable=True)
    quiz_question: Mapped[str | None] = mapped_column(Text, nullable=True)
    quiz_options: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    quiz_correct_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    hint: Mapped[str | None] = mapped_column(Text, nullable=True)
    safety_rules: Mapped[str | None] = mapped_column(Text, nullable=True)
