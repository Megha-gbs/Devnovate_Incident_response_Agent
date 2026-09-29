"""Incident CRUD and lifecycle endpoints."""

from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import APIResponse
from app.schemas.incident import (
    IncidentCreate,
    IncidentListItem,
    IncidentOut,
    IncidentUpdate,
    KnowledgeEntryOut,
    PostmortemOut,
    PostmortemRequest,
    ResolveRequest,
    RetainRequest,
    UpdateStepRequest,
)
from app.services.incident_service import incident_service, incident_to_out

router = APIRouter()


@router.post("/incidents", response_model=APIResponse[IncidentOut], status_code=201)
@router.post("/incidents/", response_model=APIResponse[IncidentOut], status_code=201)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)) -> APIResponse[IncidentOut]:
    incident = incident_service.create(db, payload)
    return APIResponse(data=incident_to_out(incident))


@router.get("/incidents", response_model=APIResponse[list[IncidentListItem]])
@router.get("/incidents/", response_model=APIResponse[list[IncidentListItem]])
def list_incidents(
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> APIResponse[list[IncidentListItem]]:
    rows = incident_service.list_incidents(db, status=status)
    items = [
        IncidentListItem(
            incident_id=row.id,
            id=row.id,
            title=row.title,
            severity=row.severity,
            status="resolved" if row.status == "RESOLVED" else "active",
            affected_service=row.affected_service,
            service=row.affected_service,
            created_at=row.created_at.isoformat() if row.created_at else "",
            updated_at=row.updated_at.isoformat() if row.updated_at else "",
            timestamp=row.created_at.isoformat() if row.created_at else "",
            category=row.category,
            priority=row.priority,
            symptoms=row.symptoms or row.description or "",
        )
        for row in rows
    ]
    return APIResponse(data=items)


@router.get("/incidents/{incident_id}", response_model=APIResponse[IncidentOut])
@router.get("/incidents/{incident_id}/", response_model=APIResponse[IncidentOut])
def get_incident(incident_id: str, db: Session = Depends(get_db)) -> APIResponse[IncidentOut]:
    incident = incident_service.get(db, incident_id)
    return APIResponse(data=incident_to_out(incident))


@router.patch("/incidents/{incident_id}", response_model=APIResponse[IncidentOut])
@router.patch("/incidents/{incident_id}/", response_model=APIResponse[IncidentOut])
def patch_incident(
    incident_id: str, payload: IncidentUpdate, db: Session = Depends(get_db)
) -> APIResponse[IncidentOut]:
    incident = incident_service.update(db, incident_id, payload)
    return APIResponse(data=incident_to_out(incident))


@router.get("/incidents/{incident_id}/timeline", response_model=APIResponse[list[dict]])
@router.get("/incidents/{incident_id}/timeline/", response_model=APIResponse[list[dict]])
def get_timeline(incident_id: str, db: Session = Depends(get_db)) -> APIResponse[list[dict]]:
    incident = incident_service.get(db, incident_id)
    data = incident_to_out(incident).timeline or []
    return APIResponse(data=data)


@router.post("/incidents/{incident_id}/steps", response_model=APIResponse[dict])
@router.post("/incidents/{incident_id}/steps/", response_model=APIResponse[dict])
def update_step(
    incident_id: str, payload: UpdateStepRequest, db: Session = Depends(get_db)
) -> APIResponse[dict]:
    updated_step = incident_service.update_step(
        db,
        incident_id=incident_id,
        step_id=payload.stepId,
        status=payload.status,
        notes=payload.notes,
    )
    return APIResponse(data=updated_step)


@router.post("/incidents/{incident_id}/resolve", response_model=APIResponse[IncidentOut])
@router.post("/incidents/{incident_id}/resolve/", response_model=APIResponse[IncidentOut])
def resolve_incident(
    incident_id: str, payload: ResolveRequest, db: Session = Depends(get_db)
) -> APIResponse[IncidentOut]:
    resolved_by = payload.resolvedBy or payload.resolved_by or "Lead SRE"
    root_cause = payload.root_cause or payload.rootCause
    resolution = payload.resolution or payload.remediation or payload.summary
    summary = payload.summary or "Incident resolved successfully."
    incident = incident_service.resolve_incident(
        db,
        incident_id=incident_id,
        summary=summary,
        resolved_by=resolved_by,
        root_cause=root_cause,
        resolution=resolution,
    )
    return APIResponse(data=incident_to_out(incident))


@router.post("/incidents/{incident_id}/postmortem", response_model=APIResponse[dict])
@router.post("/incidents/{incident_id}/postmortem/", response_model=APIResponse[dict])
def create_postmortem(
    incident_id: str, payload: PostmortemRequest, db: Session = Depends(get_db)
) -> APIResponse[dict]:
    pm_data = incident_service.save_postmortem(
        db,
        incident_id=incident_id,
        root_cause=payload.rootCause,
        impact=payload.impact,
        timeline_text=payload.timeline,
        action_items=payload.actionItems,
    )
    return APIResponse(data=pm_data)


@router.post("/incidents/{incident_id}/retain", response_model=APIResponse[dict])
@router.post("/incidents/{incident_id}/retain/", response_model=APIResponse[dict])
def retain_knowledge(
    incident_id: str, payload: RetainRequest, db: Session = Depends(get_db)
) -> APIResponse[dict]:
    knowledge_data = incident_service.retain_knowledge(
        db,
        incident_id=incident_id,
        insight=payload.insight,
        tags=payload.tags,
    )
    return APIResponse(data=knowledge_data)
