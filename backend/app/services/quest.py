from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.quest import Quest, QuestCheckpoint
from app.models.user import User
from app.schemas.quest import QuestCheckpointCreate, QuestCreate


def create_quest(db: Session, user: User, data: QuestCreate) -> Quest:
    if data.difficulty < 1 or data.difficulty > 5:
        raise HTTPException(status_code=400, detail="Difficulty must be between 1 and 5")
    if data.duration_minutes <= 0:
        raise HTTPException(status_code=400, detail="Duration must be positive")

    quest = Quest(
        author_user_id=user.id,
        title=data.title.strip(),
        description=data.description.strip(),
        city_area=data.city_area.strip(),
        difficulty=data.difficulty,
        duration_minutes=data.duration_minutes,
        rules=data.rules,
        status="draft",
    )
    db.add(quest)
    db.commit()
    db.refresh(quest)
    return quest


def _validate_checkpoint_payload(data: QuestCheckpointCreate) -> None:
    task_type = data.task_type.strip().lower()
    if task_type not in {"codeword", "quiz"}:
        raise HTTPException(status_code=400, detail="Unsupported task_type")

    if task_type == "codeword":
        if not data.codeword_answer:
            raise HTTPException(status_code=400, detail="codeword_answer is required")
        return

    if not data.quiz_options or len(data.quiz_options) != 4:
        raise HTTPException(status_code=400, detail="quiz_options must contain 4 options")
    if data.quiz_correct_index is None or data.quiz_correct_index < 0 or data.quiz_correct_index > 3:
        raise HTTPException(status_code=400, detail="quiz_correct_index must be between 0 and 3")
    if not data.quiz_question:
        raise HTTPException(status_code=400, detail="quiz_question is required for quiz")


def add_checkpoint(db: Session, user: User, quest_id: int, data: QuestCheckpointCreate) -> QuestCheckpoint:
    quest = db.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    if quest.author_user_id != user.id:
        raise HTTPException(status_code=403, detail="Only quest author can modify checkpoints")
    if quest.status != "draft":
        raise HTTPException(status_code=409, detail="Checkpoints can be edited only in draft status")

    _validate_checkpoint_payload(data)
    task_type = data.task_type.strip().lower()

    checkpoint = QuestCheckpoint(
        quest_id=quest.id,
        order_index=data.order_index,
        title=data.title.strip(),
        lat=data.lat,
        lon=data.lon,
        task_type=task_type,
        task_text=data.task_text.strip(),
        codeword_answer=data.codeword_answer.strip() if data.codeword_answer else None,
        quiz_question=data.quiz_question.strip() if data.quiz_question else None,
        quiz_options=data.quiz_options,
        quiz_correct_index=data.quiz_correct_index,
        hint=data.hint,
        safety_rules=data.safety_rules,
    )
    db.add(checkpoint)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="order_index must be unique within quest")
    db.refresh(checkpoint)
    return checkpoint


def submit_quest_for_moderation(db: Session, user: User, quest_id: int) -> Quest:
    quest = db.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    if quest.author_user_id != user.id:
        raise HTTPException(status_code=403, detail="Only quest author can submit quest")
    if quest.status != "draft":
        raise HTTPException(status_code=409, detail="Only draft quest can be submitted")

    checkpoints_count = db.query(QuestCheckpoint).filter(QuestCheckpoint.quest_id == quest.id).count()
    if checkpoints_count < 3:
        raise HTTPException(status_code=400, detail="Quest must contain at least 3 checkpoints")

    quest.status = "moderation"
    quest.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(quest)
    return quest
