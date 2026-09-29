"""Incident report generation from stored state — not a fresh hallucination."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.services.incident_service import incident_service, incident_to_out


class Reporter:
    def build(self, db: Session, incident: Incident) -> dict[str, Any]:
        out = incident_to_out(incident)
        analysis = incident.agent_analysis or {}
        report = {
            "incident_id": incident.id,
            "title": incident.title,
            "status": incident.status,
            "severity": incident.severity,
            "affected_service": incident.affected_service,
            "opened_at": out.created_at,
            "updated_at": out.updated_at,
            "summary": analysis.get("summary") or incident.description,
            "observed_evidence": [
                item
                for item in (analysis.get("evidence") or [])
                if item.get("kind") == "observed"
            ],
            "hypotheses": [
                item
                for item in (analysis.get("evidence") or [])
                if item.get("kind") in {"hypothesis", "inferred"}
            ],
            "suspected_root_cause": incident.suspected_root_cause,
            "root_cause_confidence": incident.root_cause_confidence,
            "recommended_actions": [a.model_dump() for a in out.recommended_actions],
            "execution_result": incident.execution_result,
            "verification_result": incident.verification_result,
            "resolution_summary": incident.resolution_summary,
            "timeline": out.timeline,
            "disclaimer": (
                "Suspected root cause is a hypothesis unless independently confirmed. "
                "This report is generated from stored incident state."
            ),
        }
        incident_service.add_timeline(
            db,
            incident,
            event="REPORT_GENERATED",
            actor="reporter",
            result="Incident report compiled from stored evidence",
        )
        db.commit()
        return report


reporter = Reporter()
