from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserProfileUpdate

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
        raise HTTPException(status_code=409, detail="Nickname is already taken")

    db.refresh(user)
    return user
