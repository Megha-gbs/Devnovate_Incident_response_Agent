"""Create tables and seed initial/historical incidents on startup."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from sqlalchemy import select

from app.db.base import Base
from app.db.session import get_engine, get_session_factory
from app.models import action, incident, timeline  # noqa: F401
from app.models.incident import Incident
from app.models.timeline import TimelineEvent
from app.utils.ids import new_event_id, utc_now

logger = logging.getLogger(__name__)


def seed_historical_incidents() -> None:
    """Seed benchmark/historical incidents into SQLite so they are always available."""
    possible_roots = [
        Path(__file__).resolve().parent.parent.parent.parent,
        Path(__file__).resolve().parent.parent.parent,
        Path("."),
    ]
    incidents_dir = None
    for root in possible_roots:
        candidate = root / "data" / "historical" / "incidents"
        if candidate.is_dir():
            incidents_dir = candidate
            break

    if not incidents_dir:
        logger.warning("Historical incidents directory not found, skipping seeding.")
        return

    SessionLocal = get_session_factory()
    with SessionLocal() as db:
        for json_file in sorted(incidents_dir.glob("*.json")):
            try:
                with open(json_file, "r", encoding="utf-8") as f:
                    data = json.load(f)

                inc_id = (data.get("incident_id") or "").strip().upper()
                if not inc_id:
                    continue

                # Check if already in DB
                existing = db.scalar(select(Incident).where(Incident.id == inc_id))
                if existing:
                    continue

                symptoms_raw = data.get("symptoms", [])
                symptoms_str = (
                    "\n".join(str(s) for s in symptoms_raw)
                    if isinstance(symptoms_raw, list)
                    else str(symptoms_raw)
                )

                sev = (data.get("severity") or "MEDIUM").upper()
                sev_map = {"CRITICAL": "CRITICAL", "HIGH": "HIGH", "MEDIUM": "MEDIUM", "LOW": "LOW"}
                sev_val = sev_map.get(sev, "MEDIUM")
                prio_map = {"CRITICAL": "P1", "HIGH": "P2", "MEDIUM": "P3", "LOW": "P4"}
                prio_val = prio_map.get(sev, "P2")

                # INC-023, INC-024, and INC-001 should start as NEW (active) so operators can investigate/resolve them
                is_active = inc_id in {"INC-023", "INC-024", "INC-001"}
                status = "NEW" if is_active else "RESOLVED"

                title = data.get("incident") or data.get("title") or f"Incident {inc_id}"
                # For INC-023 specifically, ensure title and service align with UI mock expectations
                if inc_id == "INC-023":
                    title = "Database replica lag spike"
                    service = "Database"
                    symptoms_str = (
                        "Read replica lag exceeding 45 seconds\n"
                        "Read-heavy endpoints experiencing stale data\n"
                        "Monitoring alert: replica_lag_seconds > 30"
                    )
                    logs_list = [
                        "[2024-01-15T16:52:14Z] WARN  db-replica-01: replication lag 31.4s (threshold: 30s)",
                        "[2024-01-15T16:54:22Z] WARN  db-replica-01: replication lag 42.7s",
                        "[2024-01-15T16:56:01Z] ERROR db-replica-01: replication lag 45.2s - read queries may return stale data",
                        "[2024-01-15T16:58:30Z] INFO  db-primary: high write throughput detected (12k writes/min, normal: 4k/min)",
                    ]
                else:
                    service = data.get("service") or "system"
                    logs_list = data.get("successful_steps") or []

                row = Incident(
                    id=inc_id,
                    title=title,
                    description=symptoms_str,
                    symptoms=symptoms_str,
                    source="historical",
                    severity=sev_val,
                    priority=prio_val,
                    category="system",
                    status=status,
                    affected_service=service,
                    logs=logs_list,
                    suspected_root_cause=data.get("root_cause"),
                    resolution_summary=data.get("resolution") if status == "RESOLVED" else None,
                    resolved_by="SRE Team" if status == "RESOLVED" else None,
                    resolved_at=utc_now() if status == "RESOLVED" else None,
                )
                db.add(row)
                db.flush()

                evt = TimelineEvent(
                    id=new_event_id(),
                    incident_id=inc_id,
                    actor="system",
                    event="INCIDENT_RECORDED",
                    result=f"Incident {inc_id} initialized ({status})",
                    created_at=utc_now(),
                )
                db.add(evt)
                db.commit()
            except Exception as e:
                db.rollback()
                logger.warning("Error seeding historical incident %s: %s", json_file, e)


def init_db() -> None:
    Base.metadata.create_all(bind=get_engine())
    seed_historical_incidents()
