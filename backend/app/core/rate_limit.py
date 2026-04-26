from __future__ import annotations

import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import HTTPException, Request


_lock = Lock()
_hits: dict[str, deque[float]] = defaultdict(deque)


def rate_limit(action: str, max_per_minute: int):
    window_seconds = 60.0

    def dependency(request: Request):
        ip = request.client.host if request.client else "unknown"
        key = f"{action}:{ip}"
        now = time.time()

        with _lock:
            q = _hits[key]
            cutoff = now - window_seconds
            while q and q[0] < cutoff:
                q.popleft()

            if len(q) >= max_per_minute:
                raise HTTPException(status_code=429, detail="Too many requests")

            q.append(now)

    return dependency
