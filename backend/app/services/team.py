import secrets

from fastapi import HTTPException
from sqlalchemy import func
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


def list_my_teams(db: Session, user: User) -> list[dict]:
    rows = (
        db.query(Team, TeamMember.role)
        .join(TeamMember, TeamMember.team_id == Team.id)
        .filter(TeamMember.user_id == user.id)
        .all()
    )
    team_ids = [team.id for team, _ in rows]
    if not team_ids:
        return []

    counts = (
        db.query(TeamMember.team_id, func.count(TeamMember.id))
        .filter(TeamMember.team_id.in_(team_ids))
        .group_by(TeamMember.team_id)
        .all()
    )
    count_map = {team_id: int(cnt) for team_id, cnt in counts}

    return [
        {
            "id": team.id,
            "name": team.name,
            "description": team.description,
            "join_code": team.join_code,
            "owner_user_id": team.owner_user_id,
            "my_role": role,
            "members_count": count_map.get(team.id, 0),
        }
        for team, role in rows
    ]
