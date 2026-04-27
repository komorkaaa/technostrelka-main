from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.quest import Quest, QuestCheckpoint
from app.models.run import RunCheckpointProgress, RunSession
from app.models.team import Team, TeamMember
from app.models.user import User
from app.schemas.run import RunStartRequest, RunSubmitRequest

POINTS_PER_CHECKPOINT = 10
POINTS_FOR_FINISH = 50


def _get_ordered_checkpoints(db: Session, quest_id: int) -> list[QuestCheckpoint]:
    checkpoints = (
        db.query(QuestCheckpoint)
        .filter(QuestCheckpoint.quest_id == quest_id)
        .order_by(QuestCheckpoint.order_index.asc())
        .all()
    )
    if not checkpoints:
        raise HTTPException(status_code=409, detail="Quest has no checkpoints")
    return checkpoints


def start_run(db: Session, user: User, data: RunStartRequest) -> RunSession:
    quest = db.get(Quest, data.quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    if quest.status != "published":
        raise HTTPException(status_code=409, detail="Only published quests can be started")

    run = None
    if data.mode == "solo":
        anti_cheat_from = datetime.utcnow() - timedelta(hours=24)
        recent_finish = (
            db.query(RunSession)
            .filter(
                RunSession.user_id == user.id,
                RunSession.quest_id == quest.id,
                RunSession.status == "finished",
                RunSession.finished_at.is_not(None),
                RunSession.finished_at >= anti_cheat_from,
            )
            .first()
        )
        if recent_finish:
            raise HTTPException(
                status_code=409,
                detail="This user already has a finished run for this quest in last 24 hours",
            )

        run = RunSession(
            quest_id=quest.id,
            mode="solo",
            user_id=user.id,
            team_id=None,
            status="started",
            current_checkpoint_order=1,
            score_total=0,
        )
    else:
        members = (
            db.query(TeamMember)
            .filter(TeamMember.team_id == data.team_id)
            .all()
        )
        member_user_ids = [m.user_id for m in members]
        if user.id not in member_user_ids:
            raise HTTPException(status_code=403, detail="User is not a member of this team")
        if len(member_user_ids) < 2 or len(member_user_ids) > 6:
            raise HTTPException(status_code=409, detail="Team size must be between 2 and 6")
        if quest.author_user_id in member_user_ids:
            raise HTTPException(
                status_code=409,
                detail="Team cannot start quest when author is in the team",
            )

        anti_cheat_from = datetime.utcnow() - timedelta(hours=24)
        recent_team_finish = (
            db.query(RunSession)
            .filter(
                RunSession.team_id == data.team_id,
                RunSession.quest_id == quest.id,
                RunSession.status == "finished",
                RunSession.finished_at.is_not(None),
                RunSession.finished_at >= anti_cheat_from,
            )
            .first()
        )
        if recent_team_finish:
            raise HTTPException(
                status_code=409,
                detail="This team already has a finished run for this quest in last 24 hours",
            )

        run = RunSession(
            quest_id=quest.id,
            mode="team",
            user_id=None,
            team_id=data.team_id,
            status="started",
            current_checkpoint_order=1,
            score_total=0,
        )

    checkpoints = _get_ordered_checkpoints(db, quest.id)

    db.add(run)
    db.flush()
    for idx, checkpoint in enumerate(checkpoints):
        db.add(
            RunCheckpointProgress(
                run_id=run.id,
                checkpoint_id=checkpoint.id,
                status="active" if idx == 0 else "locked",
                attempts=0,
            )
        )
    db.commit()
    db.refresh(run)
    return run


def _ensure_access_to_run(db: Session, user: User, run: RunSession) -> None:
    if run.mode == "solo":
        if run.user_id != user.id:
            raise HTTPException(status_code=403, detail="No access to this run")
        return

    membership = (
        db.query(TeamMember)
        .filter(TeamMember.team_id == run.team_id, TeamMember.user_id == user.id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=403, detail="No access to this run")


def get_run_state(db: Session, user: User, run_id: int) -> dict:
    run = db.get(RunSession, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    _ensure_access_to_run(db, user, run)

    progress_rows = (
        db.query(RunCheckpointProgress, QuestCheckpoint)
        .join(QuestCheckpoint, QuestCheckpoint.id == RunCheckpointProgress.checkpoint_id)
        .filter(RunCheckpointProgress.run_id == run.id)
        .order_by(QuestCheckpoint.order_index.asc())
        .all()
    )
    if not progress_rows:
        raise HTTPException(status_code=404, detail="Run progress not found")

    passed_count = sum(1 for progress, _ in progress_rows if progress.status == "passed")
    total = len(progress_rows)
    active = next((item for item in progress_rows if item[0].status == "active"), None)

    return {
        "run": run,
        "progress_text": f"{passed_count}/{total}",
        "current_checkpoint": active[1] if active else None,
        "passed_count": passed_count,
        "total_count": total,
    }


def submit_run_answer(db: Session, user: User, run_id: int, data: RunSubmitRequest) -> dict:
    run = db.get(RunSession, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    _ensure_access_to_run(db, user, run)
    if run.status in {"finished", "abandoned"}:
        raise HTTPException(status_code=409, detail="Run is already completed")

    active_progress_row = (
        db.query(RunCheckpointProgress, QuestCheckpoint)
        .join(QuestCheckpoint, QuestCheckpoint.id == RunCheckpointProgress.checkpoint_id)
        .filter(RunCheckpointProgress.run_id == run.id, RunCheckpointProgress.status == "active")
        .first()
    )
    if not active_progress_row:
        raise HTTPException(status_code=409, detail="No active checkpoint to submit")

    progress, checkpoint = active_progress_row
    if checkpoint.task_type == "codeword" and progress.attempts >= settings.CODEWORD_MAX_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many attempts for this checkpoint")

    progress.attempts += 1

    is_correct = False
    if checkpoint.task_type == "codeword":
        if not data.codeword_answer:
            raise HTTPException(status_code=400, detail="codeword_answer is required")
        expected = (checkpoint.codeword_answer or "").strip().lower()
        actual = data.codeword_answer.strip().lower()
        is_correct = expected == actual
    elif checkpoint.task_type == "quiz":
        if data.quiz_selected_index is None:
            raise HTTPException(status_code=400, detail="quiz_selected_index is required")
        is_correct = data.quiz_selected_index == checkpoint.quiz_correct_index

    if not is_correct:
        db.commit()
        return {"correct": False, "status": run.status}

    progress.status = "passed"
    progress.answered_at = datetime.utcnow()
    run.score_total += POINTS_PER_CHECKPOINT

    next_checkpoint = (
        db.query(RunCheckpointProgress, QuestCheckpoint)
        .join(QuestCheckpoint, QuestCheckpoint.id == RunCheckpointProgress.checkpoint_id)
        .filter(
            RunCheckpointProgress.run_id == run.id,
            QuestCheckpoint.order_index == checkpoint.order_index + 1,
        )
        .first()
    )

    if not next_checkpoint:
        run.status = "finished"
        run.finished_at = datetime.utcnow()
        run.score_total += POINTS_FOR_FINISH
    else:
        next_progress, next_cp = next_checkpoint
        next_progress.status = "active"
        run.current_checkpoint_order = next_cp.order_index
        run.status = "in_progress"

    db.commit()
    db.refresh(run)
    return {"correct": True, "status": run.status}


def abandon_run(db: Session, user: User, run_id: int) -> RunSession:
    run = db.get(RunSession, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    _ensure_access_to_run(db, user, run)
    if run.status == "finished":
        raise HTTPException(status_code=409, detail="Finished run cannot be abandoned")
    if run.status == "abandoned":
        return run

    run.status = "abandoned"
    run.finished_at = datetime.utcnow()
    db.commit()
    db.refresh(run)
    return run


def leaderboard_teams(db: Session) -> list[dict]:
    rows = (
        db.query(
            RunSession.team_id.label("team_id"),
            Team.name.label("team_name"),
            func.sum(RunSession.score_total).label("score_total"),
            func.count(RunSession.id).label("finished_runs"),
        )
        .join(Team, Team.id == RunSession.team_id)
        .filter(
            RunSession.mode == "team",
            RunSession.status == "finished",
            RunSession.team_id.is_not(None),
        )
        .group_by(RunSession.team_id, Team.name)
        .order_by(func.sum(RunSession.score_total).desc())
        .all()
    )

    return [
        {
            "team_id": row.team_id,
            "team_name": row.team_name,
            "score_total": int(row.score_total or 0),
            "finished_runs": int(row.finished_runs or 0),
        }
        for row in rows
    ]
