import os
from pathlib import Path

import pytest


@pytest.fixture(scope="session", autouse=True)
def _test_env():
    # Ensure tests don't depend on a running Postgres.
    db_path = Path("/tmp/technostrelka_test.sqlite3")
    if db_path.exists():
        db_path.unlink()

    os.environ["ENV"] = "dev"
    os.environ["DEBUG"] = "1"
    os.environ["SECRET_KEY"] = "test-secret"
    os.environ["ALGORITHM"] = "HS256"
    os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"
    os.environ["REFRESH_TOKEN_EXPIRE_DAYS"] = "7"
    os.environ["DATABASE_URL"] = f"sqlite+pysqlite:///{db_path}"


@pytest.fixture(scope="session")
def app():
    from app.main import app as fastapi_app
    return fastapi_app


@pytest.fixture(scope="session", autouse=True)
def _db_schema(_test_env):
    # For tests we create schema directly; production uses Alembic migrations.
    from app.db.session import Base, engine
    # Import all models so SQLAlchemy knows about the tables.
    from app.models.user import User  # noqa: F401
    from app.models.team import Team, TeamMember  # noqa: F401
    from app.models.quest import Quest, QuestCheckpoint  # noqa: F401
    from app.models.run import RunSession, RunCheckpointProgress  # noqa: F401

    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
