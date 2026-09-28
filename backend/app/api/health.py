"""Health and runtime capability checks."""

from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.common import APIResponse

router = APIRouter()


@router.get("/health", response_model=APIResponse[dict])
def health() -> APIResponse[dict]:
    settings = get_settings()
    return APIResponse(
        data={
            "status": "ok",
            "app": settings.app_name,
            "env": settings.app_env,
            "groq_configured": settings.groq_configured,
            "model": settings.groq_model if settings.groq_configured else None,
            "hackwithhyd_configured": bool(settings.hackwithhyd_api_key),
            "database": "sqlite" if settings.is_sqlite else "postgres",
        }
    )
