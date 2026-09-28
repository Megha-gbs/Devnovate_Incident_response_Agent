"""Analysis and investigation endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.agents.incident_agent import incident_agent
from app.db.session import get_db
from app.schemas.analysis import AnalysisOut
from app.schemas.common import APIResponse
from app.schemas.incident import IncidentOut
from app.services.incident_service import incident_service, incident_to_out

router = APIRouter()


@router.post("/incidents/{incident_id}/investigate", response_model=APIResponse[IncidentOut])
def investigate(incident_id: str, db: Session = Depends(get_db)) -> APIResponse[IncidentOut]:
    incident = incident_service.get(db, incident_id)
    incident_agent.investigate(db, incident)
    incident = incident_service.get(db, incident_id)
    return APIResponse(data=incident_to_out(incident))


@router.post("/incidents/{incident_id}/analyze", response_model=APIResponse[AnalysisOut])
def analyze(incident_id: str, db: Session = Depends(get_db)) -> APIResponse[AnalysisOut]:
    incident = incident_service.get(db, incident_id)
    if not incident.logs:
        incident_agent.investigate(db, incident)
        incident = incident_service.get(db, incident_id)
    analysis = incident_agent.analyze(db, incident)
    incident = incident_service.get(db, incident_id)
    stored = incident.agent_analysis or analysis.model_dump()
    return APIResponse(
        data=AnalysisOut(
            incident_id=incident.id,
            status=incident.status,
            analysis=analysis,
            groq_used=bool(stored.get("groq_used")),
            fallback_used=bool(stored.get("fallback_used")),
        )
    )


@router.get("/incidents/{incident_id}/analysis", response_model=APIResponse[AnalysisOut])
def get_analysis(incident_id: str, db: Session = Depends(get_db)) -> APIResponse[AnalysisOut]:
    incident = incident_service.get(db, incident_id)
    stored = incident.agent_analysis
    analysis = None
    if stored:
        from app.schemas.analysis import AgentAnalysis

        analysis = AgentAnalysis.model_validate(
            {k: v for k, v in stored.items() if k not in {"groq_used", "fallback_used"}}
        )
    return APIResponse(
        data=AnalysisOut(
            incident_id=incident.id,
            status=incident.status,
            analysis=analysis,
            groq_used=bool((stored or {}).get("groq_used")),
            fallback_used=bool((stored or {}).get("fallback_used")),
        )
    )
