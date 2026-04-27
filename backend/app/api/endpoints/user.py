from fastapi import APIRouter, Depends
from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.schemas.user import UserProfileUpdate
from app.services.user import update_my_profile
from sqlalchemy.orm import Session

router = APIRouter()

@router.get("/me")
def get_me(user = Depends(get_current_user)):
    return {
        "success": True,
        "data": {
            "id": user.id,
            "email": user.email,
            "nickname": user.nickname,
            "age_group": user.age_group,
            "role": user.role,
        }
    }


@router.patch("/me")
def patch_me(
    data: UserProfileUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    user = update_my_profile(db, user=user, data=data)
    return {
        "success": True,
        "data": {
            "id": user.id,
            "email": user.email,
            "nickname": user.nickname,
            "age_group": user.age_group,
            "role": user.role,
        },
    }
