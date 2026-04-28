from fastapi import HTTPException
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings


def _json_safe(value):
    if isinstance(value, dict):
        return {k: _json_safe(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_json_safe(v) for v in value]
    if isinstance(value, tuple):
        return tuple(_json_safe(v) for v in value)
    if isinstance(value, BaseException):
        return str(value)
    return value


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    raw_errors = exc.errors()
    safe_errors = _json_safe(raw_errors)
    message = "Validation error"
    if safe_errors and isinstance(safe_errors[0], dict):
        first_msg = safe_errors[0].get("msg")
        if isinstance(first_msg, str) and first_msg.strip():
            message = first_msg

    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": message,
                "details": safe_errors,
            }
        },
    )


async def http_exception_handler(request: Request, exc: HTTPException):
    # Keep a stable envelope for any explicit HTTPException raised in the app.
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": "HTTP_ERROR",
                "message": exc.detail,
            },
        },
    )


async def unhandled_exception_handler(request: Request, exc: Exception):
    # Avoid leaking internals unless DEBUG is enabled.
    message = str(exc) if settings.DEBUG else "Internal server error"
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": message,
            },
        },
    )
