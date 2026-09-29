"""Incident report endpoint."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.agents.incident_agent import incident_agent
from app.db.session import get_db
from app.schemas.common import APIResponse
from app.services.incident_service import incident_service

router = APIRouter()


@router.get("/incidents/{incident_id}/report", response_model=APIResponse[dict])
def get_report(incident_id: str, db: Session = Depends(get_db)) -> APIResponse[dict]:
    incident = incident_service.get(db, incident_id)
    return APIResponse(data=incident_agent.report(db, incident))
