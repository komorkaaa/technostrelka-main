import redis
from app.core.config import settings

r = redis.from_url(settings.REDIS_URL) if settings.REDIS_URL else None
