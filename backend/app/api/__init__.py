"""API routers."""

from fastapi import APIRouter

from app.api import actions, alerts, analysis, demo, health, incidents, reports, stream

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(incidents.router, tags=["incidents"])
api_router.include_router(alerts.router, tags=["alerts"])
api_router.include_router(analysis.router, tags=["analysis"])
api_router.include_router(actions.router, tags=["actions"])
api_router.include_router(reports.router, tags=["reports"])
api_router.include_router(demo.router, tags=["demo"])
api_router.include_router(stream.router, tags=["realtime"])
