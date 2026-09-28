"""Collect context with tools. Does not call the LLM."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.services.incident_service import incident_service
from app.tools.history import get_deployment_info, get_incident_history
from app.tools.log_search import search_logs
from app.tools.service_status import get_service_status
from app.tools.system_metrics import get_recent_metrics


class Investigator:
    def collect(self, db: Session, incident: Incident) -> dict[str, Any]:
        incident_service.transition(
            db, incident, "INVESTIGATING", actor="investigator", commit=False
        )
        service = incident.affected_service or None

        logs = search_logs(incident.id, incident.scenario_id, service=service)
        if not logs:
            logs = search_logs(incident.id, incident.scenario_id)

        status = get_service_status(incident.id, incident.scenario_id)
        metrics = (
            get_recent_metrics(incident.id, incident.scenario_id, service)
            if service
            else {}
        )
        deployment = (
            get_deployment_info(incident.id, incident.scenario_id, service)
            if service
            else {}
        )
        history = get_incident_history(incident.id, incident.scenario_id)

        incident.logs = logs
        context = {
            "incident_id": incident.id,
            "title": incident.title,
            "description": incident.description,
            "severity": incident.severity,
            "category": incident.category,
            "affected_service": incident.affected_service,
            "alerts": incident.alerts,
            "scenario_id": incident.scenario_id,
            "logs": logs,
            "service_status": status,
            "metrics": metrics,
            "deployment": deployment,
            "history": history,
        }

        incident_service.add_timeline(
            db,
            incident,
            event="CONTEXT_COLLECTED",
            actor="investigator",
            result=f"Collected {len(logs)} logs",
            extra={
                "log_count": len(logs),
                "services": list((status.get("services") or {}).keys()),
            },
        )
        db.commit()
        return context


investigator = Investigator()
