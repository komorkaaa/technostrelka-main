#!/bin/sh
set -eu

set +e
python - <<'PY'
from sqlalchemy import create_engine, inspect
from app.core.config import settings

engine = create_engine(settings.database_url)
insp = inspect(engine)

has_alembic = insp.has_table("alembic_version")
has_users = insp.has_table("users")

if has_alembic:
    raise SystemExit(0)
if has_users:
    # Legacy schema (created via create_all) exists; stamp migrations to avoid failing on first upgrade.
    raise SystemExit(2)
raise SystemExit(1)
PY

status=$?
set -e
if [ "$status" -eq 2 ]; then
  echo "Detected legacy schema without alembic_version; stamping head..."
  alembic stamp head
fi

alembic upgrade head

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
