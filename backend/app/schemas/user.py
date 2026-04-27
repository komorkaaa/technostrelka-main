from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    # For MVP we allow demo-moderator login "moderator" (non-email).
    # Regular users still register with a valid email (UserCreate.email).
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True
