from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies.db import get_db
from app.services.run import leaderboard_team_details, leaderboard_teams

router = APIRouter()


@router.get("/teams")
def leaderboard_teams_endpoint(db: Session = Depends(get_db)):
    items = leaderboard_teams(db)
    return {"success": True, "data": {"items": items}}


@router.get("/teams/{team_id}")
def leaderboard_team_details_endpoint(
    team_id: int,
    db: Session = Depends(get_db),
):
    data = leaderboard_team_details(db, team_id=team_id)
    return {"success": True, "data": data}
