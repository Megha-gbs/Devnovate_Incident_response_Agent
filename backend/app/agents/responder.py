"""Turn analysis into persisted recommended actions and wait for a human."""

from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.schemas.analysis import AgentAnalysis
from app.services.incident_service import incident_service
from app.services.notification_service import notification_service


class Responder:
    def recommend(self, db: Session, incident: Incident, analysis: AgentAnalysis) -> None:
        # Replace previous pending recommendations from a re-run.
        for existing in list(incident.actions):
            if existing.status == "pending":
                db.delete(existing)
        db.flush()

        for draft in analysis.recommended_actions:
            action = incident_service.add_action(
                db,
                incident,
                action_type=draft.action_type,
                target=draft.target,
                reason=draft.reason,
                risk=draft.risk,
                expected_result=draft.expected_result,
                requires_approval=True,
            )
            notification_service.notify_approval_required(
                incident.id, action.action_type, action.target
            )

        incident_service.transition(
            db, incident, "AWAITING_APPROVAL", actor="responder", commit=False
        )
        db.commit()


responder = Responder()
