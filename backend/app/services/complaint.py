from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.complaint import Complaint
from app.models.quest import Quest, QuestCheckpoint
from app.models.user import User
from app.schemas.complaint import ComplaintCreate


def create_complaint(db: Session, user: User, data: ComplaintCreate) -> Complaint:
    reason = data.reason.strip()

    quest_id = data.quest_id
    checkpoint_id = data.checkpoint_id

    if quest_id is not None:
        quest = db.get(Quest, quest_id)
        if not quest:
            raise HTTPException(status_code=404, detail="Квест не найден")

    if checkpoint_id is not None:
        checkpoint = db.get(QuestCheckpoint, checkpoint_id)
        if not checkpoint:
            raise HTTPException(status_code=404, detail="Точка не найдена")

    complaint = Complaint(
        author_user_id=user.id,
        quest_id=quest_id,
        checkpoint_id=checkpoint_id,
        reason=reason,
        status="new",
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint


def list_complaints(db: Session, status: str | None = None) -> list[Complaint]:
    q = db.query(Complaint).order_by(Complaint.created_at.desc())
    if status:
        q = q.filter(Complaint.status == status)
    return q.all()


def resolve_complaint(db: Session, complaint_id: int) -> Complaint:
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Жалоба не найдена")
    complaint.status = "handled"
    db.commit()
    db.refresh(complaint)
    return complaint

