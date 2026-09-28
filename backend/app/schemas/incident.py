"""Incident request/response schemas."""

from typing import Any

from pydantic import BaseModel, Field, field_validator

from app.schemas.common import IncidentStatus, Severity


class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(default="", max_length=8000)
    source: str = Field(default="manual", max_length=80)
    severity: Severity = Severity.MEDIUM
    priority: str = Field(default="P2", max_length=10)
    category: str = Field(default="unknown", max_length=80)
    affected_service: str = Field(default="", max_length=120)
    affected_resources: list[str] = Field(default_factory=list)
    alerts: list[dict[str, Any]] = Field(default_factory=list)
    scenario_id: str | None = None

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, value: str) -> str:
        allowed = {"P1", "P2", "P3", "P4"}
        upper = value.upper()
        if upper not in allowed:
            raise ValueError("priority must be one of P1, P2, P3, P4")
        return upper


class IncidentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=255)
    description: str | None = None
    severity: Severity | None = None
    priority: str | None = None
    category: str | None = None
    status: IncidentStatus | None = None
    affected_service: str | None = None
    resolution_summary: str | None = None


class ActionOut(BaseModel):
    id: str
    incident_id: str
    action_type: str
    target: str
    reason: str
    risk: str
    expected_result: str
    requires_approval: bool
    status: str
    execution_result: dict[str, Any] | None = None
    created_at: str
    updated_at: str


class IncidentOut(BaseModel):
    incident_id: str
    title: str
    description: str
    source: str
    severity: str
    priority: str
    category: str
    status: str
    created_at: str
    updated_at: str
    affected_service: str
    affected_resources: list[Any]
    alerts: list[Any]
    logs: list[Any]
    observations: list[Any]
    suspected_root_cause: str | None
    root_cause_confidence: float | None
    recommended_actions: list[ActionOut]
    approved_action: str | None
    execution_result: dict[str, Any] | None
    verification_result: dict[str, Any] | None
    timeline: list[dict[str, Any]] | None = None
    agent_analysis: dict[str, Any] | None
    resolution_summary: str | None
    scenario_id: str | None = None


class IncidentListItem(BaseModel):
    incident_id: str
    title: str
    severity: str
    status: str
    affected_service: str
    created_at: str
    updated_at: str
    category: str
    priority: str


class ResolveRequest(BaseModel):
    summary: str = Field(default="", max_length=4000)
    escalate: bool = False
