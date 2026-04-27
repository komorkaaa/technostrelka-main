from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_moderator
from app.dependencies.db import get_db
from app.schemas.complaint import ComplaintResolveRequest
from app.schemas.moderation import ModerationRejectRequest
from app.services.complaint import list_complaints, resolve_complaint
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


@router.get("/complaints")
def list_complaints_endpoint(
    status: str | None = None,
    db: Session = Depends(get_db),
    _moderator=Depends(get_current_moderator),
):
    items = list_complaints(db, status=status)
    return {
        "success": True,
        "data": {
            "items": [
                {
                    "id": c.id,
                    "author_user_id": c.author_user_id,
                    "quest_id": c.quest_id,
                    "checkpoint_id": c.checkpoint_id,
                    "reason": c.reason,
                    "status": c.status,
                    "created_at": c.created_at,
                }
                for c in items
            ]
        },
    }


@router.post("/complaints/{complaint_id}/resolve")
def resolve_complaint_endpoint(
    complaint_id: int,
    _data: ComplaintResolveRequest,
    db: Session = Depends(get_db),
    _moderator=Depends(get_current_moderator),
):
    complaint = resolve_complaint(db, complaint_id=complaint_id)
    return {
        "success": True,
        "data": {
            "id": complaint.id,
            "status": complaint.status,
        },
    }
