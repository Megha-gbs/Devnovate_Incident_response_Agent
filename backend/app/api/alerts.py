"""Alert ingest — creates an incident from a monitoring alert."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.action import AlertIngest
from app.schemas.common import APIResponse, Severity
from app.schemas.incident import IncidentCreate, IncidentOut
from app.services.incident_service import incident_service, incident_to_out

router = APIRouter()


@router.post("/alerts", response_model=APIResponse[IncidentOut], status_code=201)
def ingest_alert(payload: AlertIngest, db: Session = Depends(get_db)) -> APIResponse[IncidentOut]:
    try:
        severity = Severity(payload.severity.upper())
    except ValueError:
        severity = Severity.HIGH

    incident = incident_service.create(
        db,
        IncidentCreate(
            title=payload.title,
            description=payload.message,
            source=payload.source,
            severity=severity,
            priority="P1" if severity in {Severity.CRITICAL, Severity.HIGH} else "P2",
            category="alert",
            affected_service=payload.service,
            alerts=[payload.model_dump()],
            scenario_id=payload.scenario_id,
        ),
    )
    return APIResponse(data=incident_to_out(incident))
