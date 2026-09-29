"""Incident persistence and mapping. All DB access for incidents lives here."""

from __future__ import annotations

import json
from typing import Any, Optional
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import ConflictError, NotFoundError
from app.models.action import RecommendedAction
from app.models.incident import Incident
from app.models.timeline import TimelineEvent
from app.schemas.common import IncidentStatus, can_transition
from app.schemas.incident import (
    ActionOut,
    IncidentCreate,
    IncidentOut,
    IncidentUpdate,
)
from app.services.event_bus import event_bus
from app.utils.ids import new_action_id, new_event_id, new_incident_id, utc_now


def _iso(value: Optional[datetime]) -> str:
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
    if include_timeline and incident.timeline:
        timeline = [
            {
                "id": event.id,
                "timestamp": _iso(event.created_at),
                "incident_id": event.incident_id,
                "actor": event.actor,
                "event": event.event,
                "action": event.action,
                "result": event.result,
                "detail": event.result or event.action,
                "metadata": event.extra,
            }
            for event in incident.timeline
        ]

    # Format logs for frontend terminal display
    logs_val = incident.logs or ""
    if isinstance(logs_val, list):
        logs_str = "\n".join(
            (item.get("message") or item.get("msg") or json.dumps(item))
            if isinstance(item, dict) else str(item)
            for item in logs_val
        )
    else:
        logs_str = str(logs_val)

    symptoms_str = incident.symptoms or incident.description or "No symptoms recorded"

    # Normalize status for frontend compatibility ('resolved' | 'active')
    status_frontend = "resolved" if incident.status == "RESOLVED" else "active"

    # Resolution
    resolution_data = None
    if incident.resolution_summary or incident.status == "RESOLVED":
        resolution_data = {
            "incidentId": incident.id,
            "rootCause": incident.suspected_root_cause or "",
            "root_cause": incident.suspected_root_cause or "",
            "resolution": incident.resolution_summary or "Incident resolved successfully.",
            "remediation": incident.resolution_summary or "Incident resolved successfully.",
            "summary": incident.resolution_summary or "Incident resolved successfully.",
            "resolvedBy": incident.resolved_by or "Lead SRE",
            "resolved_by": incident.resolved_by or "Lead SRE",
            "resolvedAt": _iso(incident.resolved_at or incident.updated_at),
            "resolved_at": _iso(incident.resolved_at or incident.updated_at),
        }

    return IncidentOut(
        id=incident.id,
        incident_id=incident.id,
        title=incident.title,
        description=incident.description,
        symptoms=symptoms_str,
        source=incident.source,
        severity="P1" if (incident.severity in ("CRITICAL", "P1") or incident.priority in ("P1", "CRITICAL")) else ("P2" if incident.severity in ("HIGH", "P2") else ("P3" if incident.severity in ("MEDIUM", "P3") else ("P4" if incident.severity in ("LOW", "P4") else incident.severity))),
        priority="P1" if (incident.severity in ("CRITICAL", "P1") or incident.priority in ("P1", "CRITICAL")) else (incident.priority or "P2"),
        category=incident.category,
        status=incident.status,
        created_at=_iso(incident.created_at),
        updated_at=_iso(incident.updated_at),
        timestamp=_iso(incident.created_at),
        service=incident.affected_service,
        affected_service=incident.affected_service,
        affected_resources=incident.affected_resources or [],
        alerts=incident.alerts or [],
        logs=logs_str,
        observations=incident.observations or [],
        suspected_root_cause=incident.suspected_root_cause,
        root_cause_confidence=incident.root_cause_confidence,
        recommended_actions=[action_to_out(a) for a in incident.actions],
        approved_action=incident.approved_action_id,
        execution_result=incident.execution_result,
        verification_result=incident.verification_result,
        timeline=timeline,
        agent_analysis=incident.agent_analysis,
        investigation=incident.investigation_data,
        resolution=resolution_data,
        postMortem=incident.postmortem_data,
        knowledgeEntry=incident.knowledge_entry,
        resolution_summary=incident.resolution_summary,
        resolved_by=incident.resolved_by,
        resolved_at=_iso(incident.resolved_at),
        scenario_id=incident.scenario_id,
    )


class IncidentService:
    def get(self, db: Session, incident_id: str) -> Incident:
        # 1. Exact match
        incident = db.scalar(
            select(Incident)
            .where(Incident.id == incident_id)
            .options(
                selectinload(Incident.actions),
                selectinload(Incident.timeline),
            )
        )
        if incident:
            return incident

        # 2. Normalized candidate match (e.g. "23" -> "INC-023", "inc-023" -> "INC-023")
        norm = str(incident_id).strip()
        candidates = [norm.upper()]
        if norm.isdigit():
            candidates.append(f"INC-{int(norm):03d}")
            candidates.append(f"INC-{int(norm)}")
        elif norm.upper().startswith("INC-"):
            parts = norm.upper().split("-", 1)
            if len(parts) == 2 and parts[1].isdigit():
                candidates.append(f"INC-{int(parts[1]):03d}")
                candidates.append(f"INC-{int(parts[1])}")

        for cand in candidates:
            if cand != incident_id:
                incident = db.scalar(
                    select(Incident)
                    .where(Incident.id == cand)
                    .options(
                        selectinload(Incident.actions),
                        selectinload(Incident.timeline),
                    )
                )
                if incident:
                    return incident

        raise NotFoundError(f"Incident {incident_id} not found")

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
        symptoms_str = payload.symptoms
        if isinstance(symptoms_str, list):
            symptoms_str = "\n".join(str(s) for s in symptoms_str)
        elif not symptoms_str:
            symptoms_str = payload.description

        logs_val = payload.logs
        if isinstance(logs_val, str):
            logs_list = [line for line in logs_val.split("\n") if line.strip()]
        elif isinstance(logs_val, list):
            logs_list = logs_val
        else:
            logs_list = []

        # Severity string representation
        sev_val = payload.severity.value if hasattr(payload.severity, "value") else str(payload.severity)

        incident = Incident(
            id=new_incident_id(),
            title=payload.title,
            description=payload.description or symptoms_str,
            symptoms=symptoms_str or payload.description,
            source=payload.source,
            severity=sev_val,
            priority=payload.priority,
            category=payload.category,
            status=IncidentStatus.NEW.value,
            affected_service=payload.affected_service or payload.service or "",
            affected_resources=payload.affected_resources,
            alerts=payload.alerts,
            logs=logs_list,
            scenario_id=payload.scenario_id,
        )
        db.add(incident)
        db.flush()
        self.add_timeline(
            db,
            incident,
            event="INCIDENT_CREATED",
            actor="system",
            result=f"{incident.id} opened for {incident.affected_service or 'system'}",
            extra={"source": payload.source, "severity": sev_val},
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
            data["severity"] = data["severity"].value if hasattr(data["severity"], "value") else str(data["severity"])
        if "priority" in data and data["priority"]:
            data["priority"] = data["priority"].upper()
        if "service" in data and data["service"]:
            data["affected_service"] = data.pop("service")
        for key, value in data.items():
            if hasattr(incident, key):
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
            event="Status changed",
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

    def update_step(
        self,
        db: Session,
        incident_id: str,
        step_id: str,
        status: str,
        notes: Optional[str] = None,
    ) -> dict[str, Any]:
        incident = self.get(db, incident_id)
        inv = incident.investigation_data or {}
        steps = inv.get("steps", [])

        action_name = "Investigation step"
        rationale = "Operational investigation workflow"
        order = 1
        found = False

        for s in steps:
            if str(s.get("id")) == str(step_id) or str(s.get("step")) == str(step_id):
                s["status"] = status
                if notes:
                    s["notes"] = notes
                action_name = s.get("action") or s.get("description") or action_name
                rationale = s.get("rationale") or s.get("why") or rationale
                order = s.get("order") or s.get("step") or order
                found = True
                break

        if not found:
            # Add step if not found
            steps.append({
                "id": step_id,
                "action": f"Step {step_id}",
                "rationale": "Operator investigation action",
                "status": status,
                "order": len(steps) + 1,
                "notes": notes,
            })

        inv["steps"] = steps
        incident.investigation_data = inv

        status_label = "WORKED" if status == "done" else "FAILED" if status == "skipped" else "STARTED"
        self.add_timeline(
            db,
            incident,
            event=f"{action_name} ({status_label})",
            actor="user",
            result=notes or status,
            extra={"step_id": step_id, "status": status, "notes": notes},
        )
        incident.updated_at = utc_now()
        db.commit()

        return {
            "id": step_id,
            "action": action_name,
            "rationale": rationale,
            "status": status,
            "order": order,
            "notes": notes,
        }

    def resolve_incident(
        self,
        db: Session,
        incident_id: str,
        summary: str,
        resolved_by: str = "Lead SRE",
        root_cause: Optional[str] = None,
        resolution: Optional[str] = None,
    ) -> Incident:
        incident = self.get(db, incident_id)
        incident.status = "RESOLVED"

        if root_cause:
            incident.suspected_root_cause = root_cause

        effective_summary = resolution or summary or incident.resolution_summary or "Incident resolved successfully."
        if root_cause and "Root Cause:" not in effective_summary:
            effective_summary = f"Root Cause: {root_cause}\n\nResolution: {effective_summary}"

        incident.resolution_summary = effective_summary
        incident.resolved_by = resolved_by
        incident.resolved_at = utc_now()
        incident.updated_at = utc_now()

        self.add_timeline(
            db,
            incident,
            event="Incident resolved",
            actor=resolved_by,
            result=incident.resolution_summary[:120],
            extra={
                "resolved_by": resolved_by,
                "root_cause": root_cause or incident.suspected_root_cause,
                "resolution": resolution or incident.resolution_summary,
            },
        )

        # Auto-retain resolution into Hindsight memory so future incidents can resolve from it
        try:
            from app.hindsight.memory import retain_postmortem
            from app.core.config import get_settings
            retain_postmortem(
                incident={
                    "id": incident.id,
                    "service": incident.affected_service or "system",
                    "title": incident.title,
                    "symptoms": incident.symptoms,
                },
                postmortem={
                    "root_cause": root_cause or incident.suspected_root_cause or "Investigated and identified",
                    "resolution": resolution or incident.resolution_summary,
                    "failed_attempts": "Avoid repeating initial unverified actions",
                    "lessons_learned": f"Resolved by {resolved_by}: {incident.resolution_summary}",
                    "post_mortem": incident.resolution_summary,
                },
                bank_id=get_settings().hindsight_bank_id,
            )
            self.add_timeline(
                db,
                incident,
                event="Knowledge retained in organizational memory",
                actor="ai",
                result=f"Retained resolution into memory bank {get_settings().hindsight_bank_id}",
                extra={"bank_id": get_settings().hindsight_bank_id},
            )
        except Exception as e:
            logger.warning("Auto-retention on resolve notice: %s", e)

        db.commit()
        return self.get(db, incident.id)

    def save_postmortem(
        self,
        db: Session,
        incident_id: str,
        root_cause: str,
        impact: str = "",
        timeline_text: str = "",
        action_items: Optional[list[str]] = None,
    ) -> dict[str, Any]:
        incident = self.get(db, incident_id)
        now_iso = utc_now().isoformat()
        pm_data = {
            "incidentId": incident_id,
            "rootCause": root_cause,
            "impact": impact,
            "timeline": timeline_text,
            "actionItems": action_items or [],
            "authoredAt": now_iso,
        }
        incident.postmortem_data = pm_data
        incident.suspected_root_cause = root_cause
        incident.updated_at = utc_now()

        self.add_timeline(
            db,
            incident,
            event="Post-mortem authored",
            actor="operator",
            result=f"Root cause: {root_cause[:120]}",
            extra=pm_data,
        )
        db.commit()
        return pm_data

    def retain_knowledge(
        self,
        db: Session,
        incident_id: str,
        insight: str,
        tags: Optional[list[str]] = None,
    ) -> dict[str, Any]:
        incident = self.get(db, incident_id)
        now_iso = utc_now().isoformat()
        tags_list = tags or ["incident", f"service:{incident.affected_service}"]

        knowledge_data = {
            "incidentId": incident_id,
            "insight": insight,
            "tags": tags_list,
            "retainedAt": now_iso,
        }
        incident.knowledge_entry = knowledge_data
        incident.updated_at = utc_now()

        # Retain via Hindsight module (dual-mode: cloud + local memory bank)
        try:
            from app.hindsight.memory import retain_postmortem
            pm_data = incident.postmortem_data or {}
            retain_postmortem(
                incident={
                    "id": incident.id,
                    "service": incident.affected_service,
                    "title": incident.title,
                    "symptoms": incident.symptoms,
                },
                postmortem={
                    "root_cause": pm_data.get("rootCause") or incident.suspected_root_cause or insight,
                    "resolution": incident.resolution_summary or insight,
                    "failed_attempts": "Avoid repeating initial unverified actions",
                    "lessons_learned": insight,
                    "post_mortem": pm_data.get("impact", ""),
                }
            )
        except Exception as e:
            logger.warning(f"Hindsight retention call note: {e}")

        self.add_timeline(
            db,
            incident,
            event="Knowledge retained in organizational memory",
            actor="ai",
            result=insight[:120],
            extra=knowledge_data,
        )
        db.commit()
        return knowledge_data

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
