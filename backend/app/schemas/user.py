from typing import Literal

from pydantic import BaseModel, EmailStr, Field


AgeGroup = Literal["10-11", "12-13", "14-15", "16-17", "18+"]
UserRole = Literal["user", "moderator"]

class UserCreate(BaseModel):
    email: EmailStr
    password: str

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


class AdminUserRoleUpdate(BaseModel):
    role: UserRole
