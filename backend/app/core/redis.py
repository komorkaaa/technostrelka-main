import redis
from app.core.config import settings

r = redis.from_url(settings.REDIS_URL)
