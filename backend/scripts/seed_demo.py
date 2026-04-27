import random
import secrets
import sys
from pathlib import Path
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

# Ensure `/app` is on sys.path when running as a standalone script inside Docker
# (python sets sys.path[0] to the script directory: `/app/scripts`).
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.quest import Quest, QuestCheckpoint
from app.models.run import RunCheckpointProgress, RunSession
from app.models.team import Team, TeamMember
from app.models.user import User
from app.models.complaint import Complaint


def _create_users(db: Session) -> list[User]:
    users: list[User] = []
    for idx in range(1, 10):
        user = User(
            email=f"user{idx}@example.com",
            nickname=f"user{idx}",
            age_group="14-15" if idx <= 5 else "16-17",
            hashed_password=hash_password("demo123"),
            role="user",
        )
        db.add(user)
        users.append(user)

    moderator = User(
        email="moderator",
        hashed_password=hash_password("demo123"),
        role="moderator",
    )
    db.add(moderator)
    users.append(moderator)
    db.flush()
    return users


def _create_teams(db: Session, users: list[User]) -> list[Team]:
    team_count = random.randint(3, 5)
    shuffled = [user for user in users if user.role == "user"]
    random.shuffle(shuffled)

    teams: list[Team] = []
    cursor = 0
    for idx in range(team_count):
        owner = shuffled[cursor]
        team = Team(
            name=f"Team {idx + 1}",
            description="Demo seeded team",
            join_code=secrets.token_hex(4).upper(),
            owner_user_id=owner.id,
        )
        db.add(team)
        db.flush()
        teams.append(team)

        members_count = random.randint(2, 5)
        members = shuffled[cursor : cursor + members_count]
        if owner not in members:
            members[0] = owner
        for member in members:
            db.add(
                TeamMember(
                    team_id=team.id,
                    user_id=member.id,
                    role="owner" if member.id == owner.id else "member",
                )
            )
        cursor = (cursor + members_count) % len(shuffled)

    return teams


def _create_quests(db: Session, authors: list[User]) -> list[Quest]:
    quest_count = random.randint(8, 12)
    quests: list[Quest] = []
    base_lat, base_lon = 56.3269, 44.0059

    for idx in range(quest_count):
        author = random.choice(authors)
        status = "published" if idx < quest_count - 1 else random.choice(["moderation", "draft"])
        quest = Quest(
            author_user_id=author.id,
            title=f"Demo Quest #{idx + 1}",
            description="Демо описание квеста для seeded данных, длина больше 30 символов.",
            city_area="Нижний Новгород",
            difficulty=random.randint(1, 5),
            duration_minutes=random.choice([45, 60, 90, 120]),
            rules="Не выходить на проезжую часть.",
            status=status,
            published_at=datetime.utcnow() if status == "published" else None,
        )
        db.add(quest)
        db.flush()
        quests.append(quest)

        cp_count = random.randint(3, 7)
        for cp_idx in range(cp_count):
            is_quiz = cp_idx % 2 == 0
            db.add(
                QuestCheckpoint(
                    quest_id=quest.id,
                    order_index=cp_idx + 1,
                    title=f"Точка {cp_idx + 1}",
                    lat=base_lat + random.random() / 100,
                    lon=base_lon + random.random() / 100,
                    task_text="Найдите подсказку и выполните задание на точке, текст длиннее 20 символов.",
                    task_type="quiz" if is_quiz else "codeword",
                    codeword_answer=None if is_quiz else f"WORD{cp_idx + 1}",
                    quiz_question="Какой вариант верный?" if is_quiz else None,
                    quiz_options=["A", "B", "C", "D"] if is_quiz else None,
                    quiz_correct_index=1 if is_quiz else None,
                    hint="Подсказка рядом",
                    safety_rules="Не заходить за ограждения",
                )
            )
    return quests


def _create_runs(db: Session, teams: list[Team], users: list[User], quests: list[Quest]) -> None:
    published_quests = [quest for quest in quests if quest.status == "published"]
    run_count = random.randint(10, 20)

    for idx in range(run_count):
        mode = random.choice(["team", "solo"])
        quest = random.choice(published_quests)
        started_at = datetime.utcnow() - timedelta(hours=random.randint(1, 72))

        if mode == "team":
            team = random.choice(teams)
            run = RunSession(
                quest_id=quest.id,
                mode="team",
                team_id=team.id,
                user_id=None,
                status=random.choice(["finished", "abandoned"]),
                current_checkpoint_order=1,
                started_at=started_at,
                finished_at=started_at + timedelta(minutes=random.randint(20, 120)),
            )
        else:
            user = random.choice([u for u in users if u.role == "user"])
            run = RunSession(
                quest_id=quest.id,
                mode="solo",
                user_id=user.id,
                team_id=None,
                status=random.choice(["finished", "abandoned"]),
                current_checkpoint_order=1,
                started_at=started_at,
                finished_at=started_at + timedelta(minutes=random.randint(20, 120)),
            )
        db.add(run)
        db.flush()

        checkpoints = (
            db.query(QuestCheckpoint)
            .filter(QuestCheckpoint.quest_id == quest.id)
            .order_by(QuestCheckpoint.order_index.asc())
            .all()
        )
        passed_count = random.randint(1, len(checkpoints))
        if run.status == "finished":
            passed_count = len(checkpoints)

        run.score_total = passed_count * 10 + (50 if run.status == "finished" else 0)
        run.current_checkpoint_order = min(passed_count + 1, len(checkpoints))

        for cp in checkpoints:
            status = "locked"
            answered_at = None
            if cp.order_index <= passed_count:
                status = "passed"
                answered_at = run.finished_at
            elif cp.order_index == passed_count + 1 and run.status != "finished":
                status = "active"

            db.add(
                RunCheckpointProgress(
                    run_id=run.id,
                    checkpoint_id=cp.id,
                    status=status,
                    attempts=random.randint(1, 3),
                    answered_at=answered_at,
                )
            )


def main():
    random.seed(42)
    db = SessionLocal()
    try:
        db.query(Complaint).delete()
        db.query(RunCheckpointProgress).delete()
        db.query(RunSession).delete()
        db.query(TeamMember).delete()
        db.query(Team).delete()
        db.query(QuestCheckpoint).delete()
        db.query(Quest).delete()
        db.query(User).delete()
        db.commit()

        users = _create_users(db)
        teams = _create_teams(db, users)
        quests = _create_quests(db, [u for u in users if u.role == "user"])
        _create_runs(db, teams, users, quests)

        db.commit()
        print("Seed complete: users, teams, quests, runs, moderator")
    finally:
        db.close()


if __name__ == "__main__":
    main()
