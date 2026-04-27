from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_moderator
from app.dependencies.db import get_db
from app.schemas.moderation import ModerationRejectRequest
from app.services.quest import approve_quest, list_moderation_quests, reject_quest

router = APIRouter()


@router.get("/quests")
def list_moderation_quests_endpoint(
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
                    "author_user_id": quest.author_user_id,
                    "title": quest.title,
                    "description": quest.description,
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
            "published_at": quest.published_at,
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
