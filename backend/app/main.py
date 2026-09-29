import sys
from pathlib import Path

_backend_dir = Path(__file__).resolve().parent.parent
_root_dir = _backend_dir.parent
for _p in [str(_backend_dir), str(_root_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import api_router
from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.logging import configure_logging
from app.db.init_db import init_db
from app.schemas.common import ErrorResponse

settings = get_settings()
configure_logging()

app = FastAPI(
    title=settings.app_name,
    description=(
        "AI-powered Incident Response Agent backend. "
        "The frontend should call /api/* and follow the incident lifecycle."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    body = ErrorResponse(error=exc.message)
    return JSONResponse(status_code=exc.status_code, content=body.model_dump())


@app.on_event("startup")
def on_startup() -> None:
    init_db()


app.include_router(api_router, prefix="/api/v1")
app.include_router(api_router, prefix="/api")
app.include_router(api_router)


@app.get("/")
def root() -> dict:
    return {
        "success": True,
        "data": {
            "name": settings.app_name,
            "docs": "/docs",
            "health": f"{settings.api_prefix}/health",
            "base_api": settings.api_prefix,
        },
        "error": None,
    }
