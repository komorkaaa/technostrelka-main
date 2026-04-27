from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.schemas.quest import QuestCheckpointCreate, QuestCreate
from app.services.quest import add_checkpoint, create_quest, submit_quest_for_moderation

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
