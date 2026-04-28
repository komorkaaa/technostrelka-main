from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.cache import cache_get_json, cache_set_json
from app.dependencies.db import get_db
from app.services.run import leaderboard_team_details, leaderboard_teams

router = APIRouter()

LEADERBOARD_TEAMS_CACHE_KEY = "leaderboard:teams:v1"
LEADERBOARD_TEAMS_CACHE_TTL_SECONDS = 60


@router.get("/teams")
def leaderboard_teams_endpoint(db: Session = Depends(get_db)):
    cached = cache_get_json(LEADERBOARD_TEAMS_CACHE_KEY)
    if cached is not None:
        return cached

    items = leaderboard_teams(db)
    response = {"success": True, "data": {"items": items}}
    cache_set_json(LEADERBOARD_TEAMS_CACHE_KEY, response, LEADERBOARD_TEAMS_CACHE_TTL_SECONDS)
    return response
  
@router.get("/teams/{team_id}")
def leaderboard_team_details_endpoint(
    team_id: int,
    db: Session = Depends(get_db),
):
    data = leaderboard_team_details(db, team_id=team_id)
    return {"success": True, "data": data}
