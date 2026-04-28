import re
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator


AgeGroup = Literal["14-15", "16-17"]
UserRole = Literal["user", "moderator"]

class UserCreate(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not (6 <= len(value) <= 128):
            raise ValueError("Пароль должен содержать от 6 до 128 символов")
        if not re.fullmatch(r"[A-Za-z0-9]+", value):
            raise ValueError("Пароль не должен содержать пробелы и спецсимволы")
        return value

class UserLogin(BaseModel):
    # For MVP we allow demo-moderator login "moderator" (non-email).
    # Regular users still register with a valid email (UserCreate.email).
    email: str
    password: str

class UserProfileUpdate(BaseModel):
    nickname: str | None = Field(default=None, min_length=2, max_length=32)
    age_group: AgeGroup | None = None

class UserOut(BaseModel):
    id: int
    email: str
    nickname: str | None = None
    age_group: AgeGroup | None = None

    class Config:
        from_attributes = True


class AdminUserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    role: UserRole = "user"

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not (8 <= len(value) <= 128):
            raise ValueError("Пароль должен содержать от 8 до 128 символов")
        if not re.fullmatch(r"[A-Za-z0-9]+", value):
            raise ValueError("Пароль не должен содержать пробелы и спецсимволы")
        return value


class AdminUserRoleUpdate(BaseModel):
    role: UserRole


class AdminUserUpdate(BaseModel):
    nickname: str | None = Field(default=None, min_length=2, max_length=32)
    age_group: AgeGroup | None = None
    role: UserRole
