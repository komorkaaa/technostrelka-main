from fastapi import APIRouter, Depends, HTTPException
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.jwt import create_access_token, create_refresh_token
from app.core.rate_limit import rate_limit
from app.dependencies.db import get_db
from app.schemas.token import RefreshTokenRequest
from app.schemas.user import UserCreate, UserLogin
from app.services.auth import authenticate_user, create_user

router = APIRouter()

@router.post("/register", status_code=201)
def register(
    data: UserCreate,
    db: Session = Depends(get_db),
    _rl=Depends(rate_limit("auth:register", settings.AUTH_RATE_LIMIT_PER_MINUTE)),
):
    user = create_user(db, data.email, data.password)

    return {
        "success": True,
        "data": {
            "id": user.id,
            "email": user.email
        }
    }


@router.post("/login")
def login(
    data: UserLogin,
    db: Session = Depends(get_db),
    _rl=Depends(rate_limit("auth:login", settings.AUTH_RATE_LIMIT_PER_MINUTE)),
):
    user = authenticate_user(db, data.email, data.password)

    if not user:
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")

    return {
        "success": True,
        "data": {
            "access_token": create_access_token(str(user.id)),
            "refresh_token": create_refresh_token(str(user.id))
        }
    }


@router.post("/refresh")
def refresh(
    data: RefreshTokenRequest,
    _rl=Depends(rate_limit("auth:refresh", settings.AUTH_RATE_LIMIT_PER_MINUTE)),
):
    try:
        payload = jwt.decode(
            data.refresh_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Некорректный токен") from exc

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Некорректный токен")

    user_id = payload.get("sub")

    return {
        "success": True,
        "data": {
            "access_token": create_access_token(user_id)
        }
    }
