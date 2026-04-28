from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    nickname: Mapped[str | None] = mapped_column(String(32), unique=True, index=True, nullable=True)
    age_group: Mapped[str | None] = mapped_column(String(8), nullable=True)
    hashed_password: Mapped[str]
    role: Mapped[str] = mapped_column(String(32), default="user")
