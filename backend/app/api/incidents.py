"""Incident CRUD and lifecycle endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.agents.incident_agent import incident_agent
from app.db.session import get_db
from app.schemas.common import APIResponse
from app.schemas.incident import (
    IncidentCreate,
    IncidentListItem,
    IncidentOut,
    IncidentUpdate,
    ResolveRequest,
)
from app.services.incident_service import incident_service, incident_to_out

router = APIRouter()


@router.post("/incidents", response_model=APIResponse[IncidentOut], status_code=201)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)) -> APIResponse[IncidentOut]:
    incident = incident_service.create(db, payload)
    return APIResponse(data=incident_to_out(incident))


@router.get("/incidents", response_model=APIResponse[list[IncidentListItem]])
def list_incidents(
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> APIResponse[list[IncidentListItem]]:
    rows = incident_service.list_incidents(db, status=status)
    items = [
        IncidentListItem(
            incident_id=row.id,
            title=row.title,
            severity=row.severity,
            status=row.status,
            affected_service=row.affected_service,
            created_at=row.created_at.isoformat() if row.created_at else "",
            updated_at=row.updated_at.isoformat() if row.updated_at else "",
            category=row.category,
            priority=row.priority,
        )
        for row in rows
    ]
    return APIResponse(data=items)


@router.get("/incidents/{incident_id}", response_model=APIResponse[IncidentOut])
def get_incident(incident_id: str, db: Session = Depends(get_db)) -> APIResponse[IncidentOut]:
    incident = incident_service.get(db, incident_id)
    return APIResponse(data=incident_to_out(incident))


@router.patch("/incidents/{incident_id}", response_model=APIResponse[IncidentOut])
def patch_incident(
    incident_id: str, payload: IncidentUpdate, db: Session = Depends(get_db)
) -> APIResponse[IncidentOut]:
    incident = incident_service.update(db, incident_id, payload)
    return APIResponse(data=incident_to_out(incident))


@router.get("/incidents/{incident_id}/timeline", response_model=APIResponse[list[dict]])
def get_timeline(incident_id: str, db: Session = Depends(get_db)) -> APIResponse[list[dict]]:
    incident = incident_service.get(db, incident_id)
    data = incident_to_out(incident).timeline or []
    return APIResponse(data=data)


@router.post("/incidents/{incident_id}/resolve", response_model=APIResponse[IncidentOut])
def resolve_incident(
    incident_id: str, payload: ResolveRequest, db: Session = Depends(get_db)
) -> APIResponse[IncidentOut]:
    incident = incident_service.get(db, incident_id)
    incident = incident_agent.resolve(db, incident, payload.summary, payload.escalate)
    return APIResponse(data=incident_to_out(incident))
