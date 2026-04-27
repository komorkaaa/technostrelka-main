from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.schemas.run import RunStartRequest, RunSubmitRequest
from app.services.run import abandon_run, get_run_state, start_run, submit_run_answer

router = APIRouter()


@router.post("/start")
def start_run_endpoint(
    data: RunStartRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    run = start_run(db, user=user, data=data)
    return {
        "success": True,
        "data": {
            "id": run.id,
            "quest_id": run.quest_id,
            "mode": run.mode,
            "status": run.status,
            "current_checkpoint_order": run.current_checkpoint_order,
        },
    }


@router.get("/{run_id}")
def get_run_endpoint(
    run_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    state = get_run_state(db, user=user, run_id=run_id)
    current_checkpoint = state["current_checkpoint"]
    return {
        "success": True,
        "data": {
            "id": state["run"].id,
            "quest_id": state["run"].quest_id,
            "mode": state["run"].mode,
            "status": state["run"].status,
            "score_total": state["run"].score_total,
            "progress": state["progress_text"],
            "current_checkpoint": (
                {
                    "id": current_checkpoint.id,
                    "order_index": current_checkpoint.order_index,
                    "title": current_checkpoint.title,
                    "task_type": current_checkpoint.task_type,
                    "task_text": current_checkpoint.task_text,
                    "hint": current_checkpoint.hint,
                }
                if current_checkpoint
                else None
            ),
        },
    }


@router.post("/{run_id}/submit")
def submit_run_endpoint(
    run_id: int,
    data: RunSubmitRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    result = submit_run_answer(db, user=user, run_id=run_id, data=data)
    return {"success": True, "data": result}


@router.post("/{run_id}/abandon")
def abandon_run_endpoint(
    run_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    run = abandon_run(db, user=user, run_id=run_id)
    return {
        "success": True,
        "data": {
            "id": run.id,
            "status": run.status,
            "finished_at": run.finished_at,
        },
    }
