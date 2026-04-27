from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.schemas.quest import QuestCheckpointCreate, QuestCreate
from app.services.quest import (
    add_checkpoint,
    archive_quest,
    create_quest,
    get_published_quest_with_checkpoints,
    list_published_quests,
    set_quest_cover,
    submit_quest_for_moderation,
)

router = APIRouter()


@router.post("")
def create_quest_endpoint(
    data: QuestCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    quest = create_quest(db, user=user, data=data)
    return {"success": True, "data": {"quest_id": quest.id, "status": quest.status}}


@router.post("/{quest_id}/checkpoints")
def add_checkpoint_endpoint(
    quest_id: int,
    data: QuestCheckpointCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    checkpoint = add_checkpoint(db, user=user, quest_id=quest_id, data=data)
    return {
        "success": True,
        "data": {
            "id": checkpoint.id,
            "quest_id": checkpoint.quest_id,
            "order_index": checkpoint.order_index,
            "title": checkpoint.title,
            "task_type": checkpoint.task_type,
        },
    }


@router.post("/{quest_id}/submit")
def submit_quest_endpoint(
    quest_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    quest = submit_quest_for_moderation(db, user=user, quest_id=quest_id)
    return {
        "success": True,
        "data": {
            "id": quest.id,
            "status": quest.status,
        },
    }


@router.post("/{quest_id}/archive")
def archive_quest_endpoint(
    quest_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    quest = archive_quest(db, user=user, quest_id=quest_id)
    return {
        "success": True,
        "data": {
            "id": quest.id,
            "status": quest.status,
        },
    }

@router.post("/{quest_id}/cover")
def upload_quest_cover_endpoint(
    quest_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    quest = set_quest_cover(db, user=user, quest_id=quest_id, file=file)
    return {
        "success": True,
        "data": {
            "id": quest.id,
            "cover_path": quest.cover_path,
        },
    }


@router.get("")
def list_quests_endpoint(
    page: int = 1,
    min_duration: int | None = None,
    max_duration: int | None = None,
    difficulty_preset: str | None = None,
    lat: float | None = None,
    lon: float | None = None,
    radius_m: float | None = None,
    db: Session = Depends(get_db),
):
    if page < 1:
        page = 1

    quests = list_published_quests(
        db,
        page=page,
        min_duration=min_duration,
        max_duration=max_duration,
        difficulty_preset=difficulty_preset,
        lat=lat,
        lon=lon,
        radius_m=radius_m,
    )
    return {
        "success": True,
        "data": {
            "page": page,
            "page_size": 10,
            "items": [
                {
                    "id": quest.id,
                    "title": quest.title,
                    "description": quest.description,
                    "city_area": quest.city_area,
                    "difficulty": quest.difficulty,
                    "duration_minutes": quest.duration_minutes,
                    "status": quest.status,
                    "published_at": quest.published_at,
                }
                for quest in quests
            ],
        },
    }


@router.get("/{quest_id}")
def get_quest_endpoint(
    quest_id: int,
    db: Session = Depends(get_db),
):
    quest, checkpoints = get_published_quest_with_checkpoints(db, quest_id=quest_id)
    return {
        "success": True,
        "data": {
            "id": quest.id,
            "title": quest.title,
            "description": quest.description,
            "city_area": quest.city_area,
            "difficulty": quest.difficulty,
            "duration_minutes": quest.duration_minutes,
            "rules": quest.rules,
            "cover_path": quest.cover_path,
            "status": quest.status,
            "published_at": quest.published_at,
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
