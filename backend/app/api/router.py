from fastapi import APIRouter
from app.api.endpoints import admin, auth, complaints, leaderboard, moderation, quests, runs, teams, user

router = APIRouter()

router.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
router.include_router(user.router, prefix="/api/v1/user", tags=["user"])
router.include_router(complaints.router, prefix="/api/v1/complaints", tags=["complaints"])
router.include_router(teams.router, prefix="/api/v1/teams", tags=["teams"])
router.include_router(quests.router, prefix="/api/v1/quests", tags=["quests"])
router.include_router(runs.router, prefix="/api/v1/runs", tags=["runs"])
router.include_router(leaderboard.router, prefix="/api/v1/leaderboard", tags=["leaderboard"])
router.include_router(moderation.router, prefix="/api/v1/moderation", tags=["moderation"])
router.include_router(admin.router, prefix="/api/v1/moderation-tools", tags=["moderation-tools"])
