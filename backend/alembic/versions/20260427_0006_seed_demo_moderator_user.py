"""seed demo moderator user

Revision ID: 20260427_0006
Revises: 20260427_0005
Create Date: 2026-04-27
"""

from alembic import op
import sqlalchemy as sa

revision = "20260427_0006"
down_revision = "20260427_0005"
branch_labels = None
depends_on = None


DEMO_EMAIL = "moderator"
DEMO_ROLE = "moderator"
# password: demo123
DEMO_HASHED_PASSWORD = (
    "$pbkdf2-sha256$29000$FkKo1XqvdW6NEWJsLQXAOA$cO1N5.mTnaOGKycDNZuXim0RkpmZHNzjtcmYw34l5aY"
)


def upgrade():
    conn = op.get_bind()
    # 1) Ensure record exists
    conn.execute(
        sa.text(
            """
            INSERT INTO users (email, hashed_password, role)
            VALUES (:email, :hashed_password, :role)
            ON CONFLICT (email) DO NOTHING
            """
        ),
        {"email": DEMO_EMAIL, "hashed_password": DEMO_HASHED_PASSWORD, "role": DEMO_ROLE},
    )
    # 2) Ensure correct role/password for demo user (don't affect other users)
    conn.execute(
        sa.text(
            """
            UPDATE users
            SET role = :role, hashed_password = :hashed_password
            WHERE email = :email
            """
        ),
        {"email": DEMO_EMAIL, "hashed_password": DEMO_HASHED_PASSWORD, "role": DEMO_ROLE},
    )


def downgrade():
    conn = op.get_bind()
    conn.execute(sa.text("DELETE FROM users WHERE email = :email"), {"email": DEMO_EMAIL})

