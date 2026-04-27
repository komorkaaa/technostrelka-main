import secrets

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.team import Team, TeamMember
from app.models.user import User
from app.schemas.team import TeamCreate

MAX_TEAM_MEMBERS = 6


def _generate_join_code() -> str:
    return secrets.token_urlsafe(6).replace("-", "").replace("_", "")[:8].upper()


def create_team(db: Session, owner: User, data: TeamCreate) -> Team:
    for _ in range(5):
        team = Team(
            name=data.name.strip(),
            description=data.description,
            owner_user_id=owner.id,
            join_code=_generate_join_code(),
        )
        db.add(team)
        try:
            db.flush()
            db.add(TeamMember(team_id=team.id, user_id=owner.id, role="owner"))
            db.commit()
            db.refresh(team)
            return team
        except IntegrityError:
            db.rollback()
            continue

    raise HTTPException(status_code=409, detail="Failed to generate unique join code")


def join_team_by_code(db: Session, user: User, code: str) -> Team:
    team = db.query(Team).filter(Team.join_code == code.upper().strip()).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    membership = (
        db.query(TeamMember)
        .filter(TeamMember.team_id == team.id, TeamMember.user_id == user.id)
        .first()
    )
    if membership:
        raise HTTPException(status_code=409, detail="User is already in this team")

    members_count = db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
    if members_count >= MAX_TEAM_MEMBERS:
        raise HTTPException(status_code=409, detail="Team is full")

    db.add(TeamMember(team_id=team.id, user_id=user.id, role="member"))
    db.commit()
    db.refresh(team)
    return team
