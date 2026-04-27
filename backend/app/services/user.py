from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import AdminUserCreate, UserProfileUpdate
from app.core.security import hash_password

def get_user_by_id(db: Session, user_id: int):
    return db.get(User, user_id)


def update_my_profile(db: Session, user: User, data: UserProfileUpdate) -> User:
    if data.nickname is not None:
        user.nickname = data.nickname.strip() or None
    if data.age_group is not None:
        user.age_group = data.age_group

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Этот никнейм уже занят")

    db.refresh(user)
    return user


def admin_list_users(db: Session) -> list[User]:
    return db.query(User).order_by(User.id.asc()).all()


def admin_create_user(db: Session, data: AdminUserCreate) -> User:
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Этот email уже зарегистрирован")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Этот email уже зарегистрирован")
    db.refresh(user)
    return user


def admin_set_user_role(db: Session, target_user_id: int, role: str, actor_user_id: int) -> User:
    user = db.get(User, target_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if user.id == actor_user_id and role != "admin":
        raise HTTPException(status_code=400, detail="Администратор не может понизить роль себе")

    user.role = role
    db.commit()
    db.refresh(user)
    return user
