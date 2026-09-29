"""Shared API enums and envelopes."""

from enum import Enum
from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class IncidentStatus(str, Enum):
    NEW = "NEW"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    INVESTIGATING = "INVESTIGATING"
    ANALYZING = "ANALYZING"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    REMEDIATING = "REMEDIATING"
    VERIFYING = "VERIFYING"
    RESOLVED = "RESOLVED"
    ESCALATED = "ESCALATED"
    FAILED = "FAILED"


class ActionStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXECUTED = "executed"
    FAILED = "failed"


class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T | None = None
    error: str | None = None


class ErrorResponse(BaseModel):
    success: bool = False
    data: Any = None
    error: str


class TimelineEventOut(BaseModel):
    id: str
    incident_id: str
    actor: str
    event: str
    action: str | None = None
    result: str | None = None
    metadata: dict | None = None
    created_at: str


ALLOWED_TRANSITIONS: dict[IncidentStatus, set[IncidentStatus]] = {
    IncidentStatus.NEW: {
        IncidentStatus.ACKNOWLEDGED,
        IncidentStatus.INVESTIGATING,
        IncidentStatus.ESCALATED,
        IncidentStatus.RESOLVED,
    },
    IncidentStatus.ACKNOWLEDGED: {
        IncidentStatus.INVESTIGATING,
        IncidentStatus.ESCALATED,
        IncidentStatus.RESOLVED,
    },
    IncidentStatus.INVESTIGATING: {
        IncidentStatus.ANALYZING,
        IncidentStatus.ESCALATED,
        IncidentStatus.FAILED,
        IncidentStatus.RESOLVED,
    },
    IncidentStatus.ANALYZING: {
        IncidentStatus.AWAITING_APPROVAL,
        IncidentStatus.INVESTIGATING,
        IncidentStatus.ESCALATED,
        IncidentStatus.FAILED,
        IncidentStatus.RESOLVED,
    },
    IncidentStatus.AWAITING_APPROVAL: {
        IncidentStatus.REMEDIATING,
        IncidentStatus.INVESTIGATING,
        IncidentStatus.ESCALATED,
        IncidentStatus.FAILED,
        IncidentStatus.RESOLVED,
    },
    IncidentStatus.REMEDIATING: {
        IncidentStatus.VERIFYING,
        IncidentStatus.FAILED,
        IncidentStatus.ESCALATED,
    },
    IncidentStatus.VERIFYING: {
        IncidentStatus.RESOLVED,
        IncidentStatus.AWAITING_APPROVAL,
        IncidentStatus.ESCALATED,
        IncidentStatus.FAILED,
    },
    IncidentStatus.FAILED: {IncidentStatus.INVESTIGATING, IncidentStatus.ESCALATED},
    IncidentStatus.ESCALATED: {IncidentStatus.INVESTIGATING, IncidentStatus.RESOLVED},
    IncidentStatus.RESOLVED: set(),
}


def can_transition(current: str, target: str) -> bool:
    try:
        current_status = IncidentStatus(current)
        target_status = IncidentStatus(target)
    except ValueError:
        return False
    return target_status in ALLOWED_TRANSITIONS.get(current_status, set())
