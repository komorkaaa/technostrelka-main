from fastapi import APIRouter
from app.api.endpoints import auth, moderation, quests, teams, user

router = APIRouter()

router.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
router.include_router(user.router, prefix="/api/v1/user", tags=["user"])
router.include_router(teams.router, prefix="/api/v1/teams", tags=["teams"])
router.include_router(quests.router, prefix="/api/v1/quests", tags=["quests"])
router.include_router(moderation.router, prefix="/api/v1/moderation", tags=["moderation"])