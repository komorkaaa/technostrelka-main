from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_moderator
from app.dependencies.db import get_db
from app.schemas.complaint import ComplaintResolveRequest
from app.schemas.quest import ModerationQuestUpdate
from app.schemas.moderation import ModerationRejectRequest
from app.services.complaint import list_complaints, resolve_complaint
from app.services.quest import (
    approve_quest,
    get_route_length_meters,
    get_quest_with_checkpoints_for_moderation,
    hide_quest,
    list_moderation_quests,
    reject_quest,
    unhide_quest,
    update_quest_for_moderation,
)

router = APIRouter()


@router.get("/quests")
def list_moderation_quests_endpoint(
    statuses: str | None = None,
    db: Session = Depends(get_db),
    _moderator=Depends(get_current_moderator),
):
    status_list = None
    if statuses:
        status_list = [part.strip() for part in statuses.split(",") if part.strip()]
    quests = list_moderation_quests(db, statuses=status_list)
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
                    "route_length_meters": get_route_length_meters(db, quest.id),
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


@router.post("/quests/{quest_id}/hide")
def hide_quest_endpoint(
    quest_id: int,
    db: Session = Depends(get_db),
    _moderator=Depends(get_current_moderator),
):
    quest = hide_quest(db, quest_id=quest_id)
    return {
        "success": True,
        "data": {
            "id": quest.id,
            "status": quest.status,
        },
    }


@router.post("/quests/{quest_id}/unhide")
def unhide_quest_endpoint(
    quest_id: int,
    db: Session = Depends(get_db),
    _moderator=Depends(get_current_moderator),
):
    quest = unhide_quest(db, quest_id=quest_id)
    return {
        "success": True,
        "data": {
            "id": quest.id,
            "status": quest.status,
        },
    }


@router.get("/quests/{quest_id}")
def get_quest_for_moderation_endpoint(
    quest_id: int,
    db: Session = Depends(get_db),
    _moderator=Depends(get_current_moderator),
):
    quest, checkpoints = get_quest_with_checkpoints_for_moderation(db, quest_id=quest_id)
    return {
        "success": True,
        "data": {
            "id": quest.id,
            "author_user_id": quest.author_user_id,
            "title": quest.title,
            "description": quest.description,
            "city_area": quest.city_area,
            "difficulty": quest.difficulty,
            "duration_minutes": quest.duration_minutes,
            "route_length_meters": get_route_length_meters(db, quest.id),
            "rules": quest.rules,
            "status": quest.status,
            "reject_reason": quest.reject_reason,
            "created_at": quest.created_at,
            "updated_at": quest.updated_at,
            "checkpoints": [
                {
                    "id": checkpoint.id,
                    "order_index": checkpoint.order_index,
                    "title": checkpoint.title,
                    "lat": checkpoint.lat,
                    "lon": checkpoint.lon,
                    "task_type": checkpoint.task_type,
                    "task_text": checkpoint.task_text,
                    "quiz_question": checkpoint.quiz_question,
                    "quiz_options": checkpoint.quiz_options,
                    "hint": checkpoint.hint,
                    "safety_rules": checkpoint.safety_rules,
                }
                for checkpoint in checkpoints
            ],
        },
    }


@router.patch("/quests/{quest_id}")
def update_quest_for_moderation_endpoint(
    quest_id: int,
    data: ModerationQuestUpdate,
    db: Session = Depends(get_db),
    _moderator=Depends(get_current_moderator),
):
    quest = update_quest_for_moderation(db, quest_id=quest_id, data=data)
    return {
        "success": True,
        "data": {
            "id": quest.id,
            "title": quest.title,
            "description": quest.description,
            "city_area": quest.city_area,
            "difficulty": quest.difficulty,
            "duration_minutes": quest.duration_minutes,
            "route_length_meters": get_route_length_meters(db, quest.id),
            "rules": quest.rules,
            "status": quest.status,
            "updated_at": quest.updated_at,
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
