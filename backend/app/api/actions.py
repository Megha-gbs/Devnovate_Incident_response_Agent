"""Human-in-the-loop action endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.agents.incident_agent import incident_agent
from app.db.session import get_db
from app.schemas.action import ApprovalRequest, RejectRequest
from app.schemas.common import APIResponse
from app.schemas.incident import ActionOut, IncidentOut
from app.services.incident_service import action_to_out, incident_service, incident_to_out

router = APIRouter()


@router.get("/incidents/{incident_id}/actions", response_model=APIResponse[list[ActionOut]])
def list_actions(incident_id: str, db: Session = Depends(get_db)) -> APIResponse[list[ActionOut]]:
    incident = incident_service.get(db, incident_id)
    return APIResponse(data=[action_to_out(a) for a in incident.actions])


@router.post(
    "/incidents/{incident_id}/actions/{action_id}/approve",
    response_model=APIResponse[IncidentOut],
)
def approve_action(
    incident_id: str,
    action_id: str,
    payload: ApprovalRequest,
    db: Session = Depends(get_db),
) -> APIResponse[IncidentOut]:
    incident = incident_service.get(db, incident_id)
    incident = incident_agent.approve_action(
        db, incident, action_id, payload.approved_by, payload.comment
    )
    return APIResponse(data=incident_to_out(incident))


@router.post(
    "/incidents/{incident_id}/actions/{action_id}/reject",
    response_model=APIResponse[IncidentOut],
)
def reject_action(
    incident_id: str,
    action_id: str,
    payload: RejectRequest,
    db: Session = Depends(get_db),
) -> APIResponse[IncidentOut]:
    incident = incident_service.get(db, incident_id)
    incident = incident_agent.reject_action(
        db, incident, action_id, payload.rejected_by, payload.reason
    )
    return APIResponse(data=incident_to_out(incident))


@router.post(
    "/incidents/{incident_id}/actions/{action_id}/execute",
    response_model=APIResponse[IncidentOut],
)
def execute_action(
    incident_id: str, action_id: str, db: Session = Depends(get_db)
) -> APIResponse[IncidentOut]:
    incident = incident_service.get(db, incident_id)
    incident = incident_agent.execute_action(db, incident, action_id)
    return APIResponse(data=incident_to_out(incident))
