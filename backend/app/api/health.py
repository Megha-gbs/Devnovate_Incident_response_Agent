"""Health and runtime capability checks."""

from fastapi import APIRouter

from app.core.config import get_settings
from app.hindsight.local_store import local_memory_bank
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
            "hindsight_configured": settings.hindsight_configured,
            "hindsight_bank": settings.hindsight_bank_id,
            "memory_bank_count": local_memory_bank.count(),
            "hackwithhyd_configured": bool(settings.hackwithhyd_api_key),
            "database": "sqlite" if settings.is_sqlite else "postgres",
        }
    )
