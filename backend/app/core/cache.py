import json
from typing import Any

from fastapi.encoders import jsonable_encoder

from app.core.redis import r


def cache_get_json(key: str) -> Any | None:
    if r is None:
        return None
    raw = r.get(key)
    if raw is None:
        return None
    try:
        return json.loads(raw)
    except Exception:
        return None


def cache_set_json(key: str, value: Any, ttl_seconds: int) -> None:
    if r is None:
        return
    payload = json.dumps(jsonable_encoder(value), ensure_ascii=False)
    r.setex(key, ttl_seconds, payload)


def cache_delete(key: str) -> None:
    if r is None:
        return
    r.delete(key)
