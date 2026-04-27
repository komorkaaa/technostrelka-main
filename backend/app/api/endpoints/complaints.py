from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.schemas.complaint import ComplaintCreate
from app.services.complaint import create_complaint

router = APIRouter()


@router.post("", status_code=201)
def create_complaint_endpoint(
    data: ComplaintCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    complaint = create_complaint(db, user=user, data=data)
    return {
        "success": True,
        "data": {
            "id": complaint.id,
            "status": complaint.status,
            "quest_id": complaint.quest_id,
            "checkpoint_id": complaint.checkpoint_id,
            "created_at": complaint.created_at,
        },
    }

