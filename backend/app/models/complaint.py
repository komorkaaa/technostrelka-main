from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Complaint(Base):
    __tablename__ = "complaints"
    __table_args__ = (
        CheckConstraint(
            "(quest_id IS NOT NULL AND checkpoint_id IS NULL) OR "
            "(quest_id IS NULL AND checkpoint_id IS NOT NULL)",
            name="ck_complaint_target_one_of",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    author_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    quest_id: Mapped[int | None] = mapped_column(ForeignKey("quests.id"), nullable=True, index=True)
    checkpoint_id: Mapped[int | None] = mapped_column(
        ForeignKey("quest_checkpoints.id"), nullable=True, index=True
    )
    reason: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(16), default="new", index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

