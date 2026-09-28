"""Orchestrates the incident-response lifecycle.

API -> IncidentAgent -> Analyzer/Investigator/Responder/Reporter -> GroqService
The LLM never executes tools itself.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.agents.analyzer import analyzer
from app.agents.investigator import investigator
from app.agents.reporter import reporter
from app.agents.responder import responder
from app.core.exceptions import ConflictError
from app.core.security import assert_action_allowed
from app.models.incident import Incident
from app.schemas.analysis import AgentAnalysis
from app.services.incident_service import incident_service
from app.services.simulation import simulation_store
from app.tools.remediation import run_remediation
from app.tools.system_metrics import get_recent_metrics


class IncidentAgent:
    def investigate(self, db: Session, incident: Incident) -> dict[str, Any]:
        if incident.status in {"RESOLVED"}:
            raise ConflictError("Resolved incidents cannot be re-investigated")
        if incident.status == "NEW":
            incident_service.transition(
                db, incident, "ACKNOWLEDGED", actor="incident-agent", commit=False
            )
        return investigator.collect(db, incident)

    def analyze(self, db: Session, incident: Incident, context: dict[str, Any] | None = None) -> AgentAnalysis:
        if context is None:
            context = {
                "incident_id": incident.id,
                "title": incident.title,
                "description": incident.description,
                "severity": incident.severity,
                "category": incident.category,
                "affected_service": incident.affected_service,
                "alerts": incident.alerts,
                "scenario_id": incident.scenario_id,
                "logs": incident.logs or [],
            }
        analysis = analyzer.analyze(db, incident, context)
        responder.recommend(db, incident, analysis)
        return analysis

    def investigate_and_analyze(self, db: Session, incident: Incident) -> AgentAnalysis:
        context = self.investigate(db, incident)
        incident = incident_service.get(db, incident.id)
        return self.analyze(db, incident, context)

    def approve_action(
        self, db: Session, incident: Incident, action_id: str, approved_by: str, comment: str = ""
    ) -> Incident:
        action = incident_service.get_action(db, incident.id, action_id)
        if action.status not in {"pending", "rejected"}:
            raise ConflictError(f"Action {action_id} is {action.status} and cannot be approved")
        action.status = "approved"
        incident.approved_action_id = action.id
        incident_service.add_timeline(
            db,
            incident,
            event="ACTION_APPROVED",
            actor=approved_by,
            action=action.action_type,
            result=comment or "Approved",
            extra={"action_id": action.id, "target": action.target},
        )
        db.commit()
        return incident_service.get(db, incident.id)

    def reject_action(
        self, db: Session, incident: Incident, action_id: str, rejected_by: str, reason: str
    ) -> Incident:
        action = incident_service.get_action(db, incident.id, action_id)
        action.status = "rejected"
        incident_service.add_timeline(
            db,
            incident,
            event="ACTION_REJECTED",
            actor=rejected_by,
            action=action.action_type,
            result=reason,
            extra={"action_id": action.id},
        )
        incident_service.transition(
            db, incident, "INVESTIGATING", actor=rejected_by, commit=False
        )
        db.commit()
        return incident_service.get(db, incident.id)

    def execute_action(self, db: Session, incident: Incident, action_id: str) -> Incident:
        action = incident_service.get_action(db, incident.id, action_id)
        if action.status != "approved":
            raise ConflictError("Action must be approved before execution")
        assert_action_allowed(action.action_type)

        incident_service.transition(
            db, incident, "REMEDIATING", actor="incident-agent", commit=False
        )
        result = run_remediation(
            incident.id, incident.scenario_id, action.action_type, action.target
        )
        action.execution_result = result
        incident.execution_result = result

        if not result.get("ok"):
            action.status = "failed"
            incident_service.transition(
                db, incident, "FAILED", actor="incident-agent", commit=False
            )
            incident_service.add_timeline(
                db,
                incident,
                event="ACTION_FAILED",
                action=action.action_type,
                result=str(result.get("error") or "execution failed"),
                extra={"action_id": action.id, "target": action.target},
            )
            db.commit()
            return incident_service.get(db, incident.id)

        action.status = "executed"
        incident_service.add_timeline(
            db,
            incident,
            event="ACTION_EXECUTED",
            action=action.action_type,
            result="Mock remediation completed",
            extra={"action_id": action.id, "target": action.target, "result": result},
        )
        db.commit()
        return self.verify(db, incident_service.get(db, incident.id))

    def verify(self, db: Session, incident: Incident) -> Incident:
        incident_service.transition(
            db, incident, "VERIFYING", actor="incident-agent", commit=False
        )
        service = incident.affected_service
        metrics = get_recent_metrics(incident.id, incident.scenario_id, service) if service else {}
        world = simulation_store.for_incident(incident.id)
        recovered = bool(world and world.recovered)
        error_rate = metrics.get("error_rate")
        healthy = recovered or (isinstance(error_rate, (int, float)) and error_rate < 0.05)

        verification = {
            "healthy": healthy,
            "recovered_flag": recovered,
            "metrics": metrics,
            "observed": (
                f"Error rate is {error_rate} after remediation."
                if error_rate is not None
                else "No error-rate metric available."
            ),
            "hypothesis": None,
        }
        if not healthy:
            verification["hypothesis"] = (
                "Service may still be degraded; additional investigation is required."
            )
        incident.verification_result = verification
        incident_service.add_timeline(
            db,
            incident,
            event="VERIFICATION_COMPLETED",
            result="healthy" if healthy else "still-degraded",
            extra=verification,
        )

        if healthy:
            incident.resolution_summary = (
                incident.resolution_summary
                or "Verification observed recovered metrics after the approved action."
            )
            incident_service.transition(
                db, incident, "RESOLVED", actor="incident-agent", commit=False
            )
            incident_service.add_timeline(
                db,
                incident,
                event="INCIDENT_RESOLVED",
                result=incident.resolution_summary,
            )
        else:
            incident_service.transition(
                db, incident, "AWAITING_APPROVAL", actor="incident-agent", commit=False
            )
        db.commit()
        return incident_service.get(db, incident.id)

    def resolve(
        self, db: Session, incident: Incident, summary: str, escalate: bool = False
    ) -> Incident:
        incident.resolution_summary = summary or incident.resolution_summary
        target = "ESCALATED" if escalate else "RESOLVED"
        if incident.status != target:
            incident_service.transition(db, incident, target, actor="operator", commit=False)
        incident_service.add_timeline(
            db,
            incident,
            event="INCIDENT_ESCALATED" if escalate else "INCIDENT_RESOLVED",
            actor="operator",
            result=incident.resolution_summary,
        )
        db.commit()
        return incident_service.get(db, incident.id)

    def report(self, db: Session, incident: Incident) -> dict[str, Any]:
        return reporter.build(db, incident)


incident_agent = IncidentAgent()
