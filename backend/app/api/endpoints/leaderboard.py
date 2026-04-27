from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies.db import get_db
from app.services.run import leaderboard_teams

router = APIRouter()


@router.get("/teams")
def leaderboard_teams_endpoint(db: Session = Depends(get_db)):
    items = leaderboard_teams(db)
    return {"success": True, "data": {"items": items}}
