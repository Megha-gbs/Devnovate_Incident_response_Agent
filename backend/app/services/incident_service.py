"""Incident persistence and mapping. All DB access for incidents lives here."""

from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import ConflictError, NotFoundError
from app.models.action import RecommendedAction
from app.models.incident import Incident
from app.models.timeline import TimelineEvent
from app.schemas.common import IncidentStatus, can_transition
from app.schemas.incident import ActionOut, IncidentCreate, IncidentOut, IncidentUpdate
from app.services.event_bus import event_bus
from app.utils.ids import new_action_id, new_event_id, new_incident_id, utc_now


def _iso(value) -> str:
    return value.isoformat() if value else ""


def action_to_out(action: RecommendedAction) -> ActionOut:
    return ActionOut(
        id=action.id,
        incident_id=action.incident_id,
        action_type=action.action_type,
        target=action.target,
        reason=action.reason,
        risk=action.risk,
        expected_result=action.expected_result,
        requires_approval=action.requires_approval,
        status=action.status,
        execution_result=action.execution_result,
        created_at=_iso(action.created_at),
        updated_at=_iso(action.updated_at),
    )


def incident_to_out(incident: Incident, include_timeline: bool = True) -> IncidentOut:
    timeline = None
    if include_timeline:
        timeline = [
            {
                "id": event.id,
                "timestamp": _iso(event.created_at),
                "incident_id": event.incident_id,
                "actor": event.actor,
                "event": event.event,
                "action": event.action,
                "result": event.result,
                "metadata": event.extra,
            }
            for event in incident.timeline
        ]
    return IncidentOut(
        incident_id=incident.id,
        title=incident.title,
        description=incident.description,
        source=incident.source,
        severity=incident.severity,
        priority=incident.priority,
        category=incident.category,
        status=incident.status,
        created_at=_iso(incident.created_at),
        updated_at=_iso(incident.updated_at),
        affected_service=incident.affected_service,
        affected_resources=incident.affected_resources or [],
        alerts=incident.alerts or [],
        logs=incident.logs or [],
        observations=incident.observations or [],
        suspected_root_cause=incident.suspected_root_cause,
        root_cause_confidence=incident.root_cause_confidence,
        recommended_actions=[action_to_out(a) for a in incident.actions],
        approved_action=incident.approved_action_id,
        execution_result=incident.execution_result,
        verification_result=incident.verification_result,
        timeline=timeline,
        agent_analysis=incident.agent_analysis,
        resolution_summary=incident.resolution_summary,
        scenario_id=incident.scenario_id,
    )


class IncidentService:
    def get(self, db: Session, incident_id: str) -> Incident:
        incident = db.scalar(
            select(Incident)
            .where(Incident.id == incident_id)
            .options(
                selectinload(Incident.actions),
                selectinload(Incident.timeline),
            )
        )
        if not incident:
            raise NotFoundError(f"Incident {incident_id} not found")
        return incident

    def list_incidents(self, db: Session, status: str | None = None) -> list[Incident]:
        stmt = (
            select(Incident)
            .options(selectinload(Incident.actions), selectinload(Incident.timeline))
            .order_by(Incident.created_at.desc())
        )
        if status:
            stmt = stmt.where(Incident.status == status)
        return list(db.scalars(stmt).all())

    def create(self, db: Session, payload: IncidentCreate) -> Incident:
        incident = Incident(
            id=new_incident_id(),
            title=payload.title,
            description=payload.description,
            source=payload.source,
            severity=payload.severity.value,
            priority=payload.priority,
            category=payload.category,
            status=IncidentStatus.NEW.value,
            affected_service=payload.affected_service,
            affected_resources=payload.affected_resources,
            alerts=payload.alerts,
            scenario_id=payload.scenario_id,
        )
        db.add(incident)
        db.flush()
        self.add_timeline(
            db,
            incident,
            event="INCIDENT_CREATED",
            actor="api",
            result="Incident opened",
            extra={"source": payload.source},
        )
        db.commit()
        db.refresh(incident)
        self._emit(incident, "INCIDENT_CREATED")
        return self.get(db, incident.id)

    def update(self, db: Session, incident_id: str, payload: IncidentUpdate) -> Incident:
        incident = self.get(db, incident_id)
        data = payload.model_dump(exclude_unset=True)
        if "status" in data and data["status"] is not None:
            target = data["status"].value if hasattr(data["status"], "value") else data["status"]
            self.transition(db, incident, target, actor="operator", commit=False)
            data.pop("status")
        if "severity" in data and data["severity"] is not None:
            data["severity"] = data["severity"].value
        if "priority" in data and data["priority"]:
            data["priority"] = data["priority"].upper()
        for key, value in data.items():
            setattr(incident, key, value)
        incident.updated_at = utc_now()
        db.commit()
        return self.get(db, incident.id)

    def transition(
        self,
        db: Session,
        incident: Incident,
        target: str,
        actor: str = "incident-agent",
        commit: bool = True,
    ) -> Incident:
        if incident.status == target:
            return incident
        if not can_transition(incident.status, target):
            raise ConflictError(
                f"Cannot transition {incident.id} from {incident.status} to {target}"
            )
        previous = incident.status
        incident.status = target
        incident.updated_at = utc_now()
        self.add_timeline(
            db,
            incident,
            event="STATUS_CHANGED",
            actor=actor,
            result=f"{previous} -> {target}",
            extra={"from": previous, "to": target},
        )
        if commit:
            db.commit()
        self._emit(incident, "STATUS_CHANGED", {"from": previous, "to": target})
        return incident

    def add_timeline(
        self,
        db: Session,
        incident: Incident,
        event: str,
        actor: str = "incident-agent",
        action: str | None = None,
        result: str | None = None,
        extra: dict[str, Any] | None = None,
    ) -> TimelineEvent:
        row = TimelineEvent(
            id=new_event_id(),
            incident_id=incident.id,
            actor=actor,
            event=event,
            action=action,
            result=result,
            extra=extra,
        )
        db.add(row)
        incident.updated_at = utc_now()
        self._emit(
            incident,
            event,
            {"action": action, "result": result, "metadata": extra, "actor": actor},
        )
        return row

    def add_action(
        self,
        db: Session,
        incident: Incident,
        action_type: str,
        target: str,
        reason: str,
        risk: str,
        expected_result: str,
        requires_approval: bool = True,
    ) -> RecommendedAction:
        row = RecommendedAction(
            id=new_action_id(),
            incident_id=incident.id,
            action_type=action_type,
            target=target,
            reason=reason,
            risk=risk,
            expected_result=expected_result,
            requires_approval=requires_approval,
            status="pending",
        )
        db.add(row)
        self.add_timeline(
            db,
            incident,
            event="ACTION_RECOMMENDED",
            action=action_type,
            extra={"target": target, "risk": risk, "action_id": row.id},
        )
        return row

    def get_action(self, db: Session, incident_id: str, action_id: str) -> RecommendedAction:
        incident = self.get(db, incident_id)
        for action in incident.actions:
            if action.id == action_id:
                return action
        raise NotFoundError(f"Action {action_id} not found on {incident_id}")

    def _emit(self, incident: Incident, event: str, extra: dict | None = None) -> None:
        event_bus.publish_sync(
            incident.id,
            {
                "incident_id": incident.id,
                "event": event,
                "status": incident.status,
                "title": incident.title,
                **(extra or {}),
            },
        )


incident_service = IncidentService()
