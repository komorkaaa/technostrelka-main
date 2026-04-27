from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.dependencies.db import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

        if payload.get("type") != "access":
            raise ValueError("Invalid token type")

        user_id = int(payload.get("sub"))
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Некорректный токен") from exc

    user = db.get(User, user_id)

    if not user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")

    return user


def get_current_moderator(user: User = Depends(get_current_user)):
    if user.role not in {"moderator", "admin"}:
        raise HTTPException(status_code=403, detail="Нужны права модератора или администратора")
    return user


def get_current_admin(user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Нужны права администратора")
    return user
