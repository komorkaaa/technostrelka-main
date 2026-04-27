from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.team import TeamMember
from app.models.user import User
from app.schemas.team import TeamCreate, TeamJoin
from app.services.team import create_team, join_team_by_code

router = APIRouter()


@router.post("")
def create_team_endpoint(
    data: TeamCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    team = create_team(db, owner=user, data=data)
    return {
        "success": True,
        "data": {
            "id": team.id,
            "name": team.name,
            "description": team.description,
            "join_code": team.join_code,
            "owner_user_id": team.owner_user_id,
        },
    }


@router.post("/join")
def join_team_endpoint(
    data: TeamJoin,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    team = join_team_by_code(db, user=user, code=data.code)
    members = (
        db.query(User)
        .join(TeamMember, User.id == TeamMember.user_id)
        .filter(TeamMember.team_id == team.id)
        .all()
    )
    return {
        "success": True,
        "data": {
            "team": {
                "id": team.id,
                "name": team.name,
                "description": team.description,
                "join_code": team.join_code,
            },
            "members": [{"id": member.id, "email": member.email} for member in members],
        },
    }
