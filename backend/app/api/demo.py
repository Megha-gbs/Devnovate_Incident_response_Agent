"""Demo scenario APIs so the frontend can run the polished walkthrough."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.agents.incident_agent import incident_agent
from app.core.exceptions import NotFoundError
from app.db.session import get_db
from app.schemas.common import APIResponse, Severity
from app.schemas.incident import IncidentCreate, IncidentOut
from app.services.incident_service import incident_service, incident_to_out
from app.services.simulation import SCENARIOS, simulation_store

router = APIRouter()


@router.get("/demo/scenarios", response_model=APIResponse[list[dict]])
def list_scenarios() -> APIResponse[list[dict]]:
    return APIResponse(data=simulation_store.list_scenarios())


@router.post(
    "/demo/scenarios/{scenario_id}/start",
    response_model=APIResponse[IncidentOut],
    status_code=201,
)
def start_scenario(scenario_id: str, db: Session = Depends(get_db)) -> APIResponse[IncidentOut]:
    """Create an incident from a mock scenario and run investigation + analysis.

    Stops at AWAITING_APPROVAL so the UI can show Approve / Reject.
    """
    try:
        spec = simulation_store.get_scenario(scenario_id)
    except KeyError as exc:
        raise NotFoundError(f"Unknown scenario '{scenario_id}'") from exc

    try:
        severity = Severity(spec["severity"])
    except ValueError:
        severity = Severity.HIGH

    incident = incident_service.create(
        db,
        IncidentCreate(
            title=spec["title"],
            description=spec["description"],
            source="demo-simulator",
            severity=severity,
            priority=spec.get("priority", "P2"),
            category=spec.get("category", "unknown"),
            affected_service=spec["affected_service"],
            affected_resources=spec.get("affected_resources", []),
            alerts=[spec.get("alert") or {}],
            scenario_id=scenario_id,
        ),
    )
    simulation_store.attach(incident.id, scenario_id)
    incident_agent.investigate_and_analyze(db, incident)
    incident = incident_service.get(db, incident.id)
    return APIResponse(data=incident_to_out(incident))


@router.get("/demo/scenarios/{scenario_id}", response_model=APIResponse[dict])
def get_scenario(scenario_id: str) -> APIResponse[dict]:
    if scenario_id not in SCENARIOS:
        raise NotFoundError(f"Unknown scenario '{scenario_id}'")
    spec = SCENARIOS[scenario_id]
    return APIResponse(
        data={
            "id": spec["id"],
            "name": spec["name"],
            "title": spec["title"],
            "description": spec["description"],
            "severity": spec["severity"],
            "affected_service": spec["affected_service"],
            "alert": spec.get("alert"),
        }
    )
