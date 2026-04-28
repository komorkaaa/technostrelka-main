from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_moderator
from app.dependencies.db import get_db
from app.schemas.moderation import ModerationRejectRequest
from app.schemas.user import AdminUserCreate, AdminUserRoleUpdate, AdminUserUpdate
from app.services.quest import approve_quest, list_moderation_quests, reject_quest
from app.services.user import admin_create_user, admin_list_users, admin_set_user_role, admin_update_user

router = APIRouter()


@router.get("/users")
def list_users_endpoint(
    db: Session = Depends(get_db),
    _moderator=Depends(get_current_moderator),
):
    users = admin_list_users(db)
    return {
        "success": True,
        "data": {
            "items": [
                {
                    "id": u.id,
                    "email": u.email,
                    "nickname": u.nickname,
                    "age_group": u.age_group,
                    "role": u.role,
                }
                for u in users
            ]
        },
    }


@router.post("/users", status_code=201)
def create_user_endpoint(
    data: AdminUserCreate,
    db: Session = Depends(get_db),
    _moderator=Depends(get_current_moderator),
):
    user = admin_create_user(db, data=data)
    return {
        "success": True,
        "data": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
        },
    }


@router.patch("/users/{user_id}/role")
def set_role_endpoint(
    user_id: int,
    data: AdminUserRoleUpdate,
    db: Session = Depends(get_db),
    moderator=Depends(get_current_moderator),
):
    user = admin_set_user_role(db, target_user_id=user_id, role=data.role, actor_user_id=moderator.id)
    return {
        "success": True,
        "data": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
        },
    }


@router.patch("/users/{user_id}")
def update_user_endpoint(
    user_id: int,
    data: AdminUserUpdate,
    db: Session = Depends(get_db),
    moderator=Depends(get_current_moderator),
):
    user = admin_update_user(db, target_user_id=user_id, data=data, actor_user_id=moderator.id)
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


@router.get("/quests/moderation")
def list_quests_moderation_endpoint(
    db: Session = Depends(get_db),
    _moderator=Depends(get_current_moderator),
):
    quests = list_moderation_quests(db)
    return {
        "success": True,
        "data": {
            "items": [
                {
                    "id": quest.id,
                    "title": quest.title,
                    "city_area": quest.city_area,
                    "difficulty": quest.difficulty,
                    "duration_minutes": quest.duration_minutes,
                    "status": quest.status,
                    "created_at": quest.created_at,
                }
                for quest in quests
            ]
        },
    }


@router.post("/quests/{quest_id}/approve")
def approve_quest_endpoint(
    quest_id: int,
    db: Session = Depends(get_db),
    _moderator=Depends(get_current_moderator),
):
    quest = approve_quest(db, quest_id=quest_id)
    return {
        "success": True,
        "data": {
            "id": quest.id,
            "status": quest.status,
        },
    }


@router.post("/quests/{quest_id}/reject")
def reject_quest_endpoint(
    quest_id: int,
    data: ModerationRejectRequest,
    db: Session = Depends(get_db),
    _moderator=Depends(get_current_moderator),
):
    quest = reject_quest(db, quest_id=quest_id, reason=data.reason)
    return {
        "success": True,
        "data": {
            "id": quest.id,
            "status": quest.status,
            "reject_reason": quest.reject_reason,
        },
    }
