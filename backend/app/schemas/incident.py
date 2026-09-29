"""Incident request/response schemas. Canonical contracts for both Frontend and Backend."""

from typing import Any, List, Optional, Union
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.common import IncidentStatus, Severity


class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(default="", max_length=8000)
    symptoms: Optional[Union[str, List[str]]] = None
    source: str = Field(default="manual", max_length=80)
    severity: Any = Severity.MEDIUM
    priority: str = Field(default="P2", max_length=10)
    category: str = Field(default="unknown", max_length=80)
    affected_service: str = Field(default="", max_length=120)
    service: Optional[str] = None
    affected_resources: list[str] = Field(default_factory=list)
    alerts: list[dict[str, Any]] = Field(default_factory=list)
    logs: Optional[Union[str, list[Any]]] = None
    recent_deployment: Optional[str] = None
    config_changes: Optional[str] = None
    scenario_id: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_aliases(cls, values: Any) -> Any:
        if isinstance(values, dict):
            # Normalize service -> affected_service
            if "service" in values and not values.get("affected_service"):
                values["affected_service"] = values["service"]
            elif "affected_service" in values and not values.get("service"):
                values["service"] = values["affected_service"]

            # Normalize symptoms -> description
            if "symptoms" in values and not values.get("description"):
                s = values["symptoms"]
                values["description"] = ", ".join(s) if isinstance(s, list) else str(s)
            elif "description" in values and not values.get("symptoms"):
                values["symptoms"] = values["description"]

            # Normalize severity string (P1, P2, P3, P4 or CRITICAL, etc.)
            sev = values.get("severity")
            if isinstance(sev, str):
                sev_upper = sev.upper()
                sev_map = {
                    "P1": "CRITICAL",
                    "P2": "HIGH",
                    "P3": "MEDIUM",
                    "P4": "LOW",
                    "CRITICAL": "CRITICAL",
                    "HIGH": "HIGH",
                    "MEDIUM": "MEDIUM",
                    "LOW": "LOW",
                }
                values["severity"] = sev_map.get(sev_upper, "MEDIUM")
                if sev_upper in {"P1", "P2", "P3", "P4"}:
                    values["priority"] = sev_upper

        return values

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, value: str) -> str:
        allowed = {"P1", "P2", "P3", "P4"}
        upper = value.upper()
        if upper not in allowed:
            return "P2"
        return upper


class IncidentUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=255)
    description: Optional[str] = None
    symptoms: Optional[str] = None
    severity: Optional[Severity] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    status: Optional[IncidentStatus] = None
    affected_service: Optional[str] = None
    service: Optional[str] = None
    resolution_summary: Optional[str] = None


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
    execution_result: Optional[dict[str, Any]] = None
    created_at: str
    updated_at: str


class ResolutionOut(BaseModel):
    incidentId: str
    summary: str
    resolvedBy: str
    resolvedAt: str


class PostmortemOut(BaseModel):
    incidentId: str
    rootCause: str
    impact: str = ""
    timeline: str = ""
    actionItems: list[str] = Field(default_factory=list)
    authoredAt: str


class KnowledgeEntryOut(BaseModel):
    incidentId: str
    insight: str
    tags: list[str] = Field(default_factory=list)
    retainedAt: str


class IncidentOut(BaseModel):
    id: str
    incident_id: str
    title: str
    description: str
    symptoms: str = ""
    source: str = "manual"
    severity: str
    priority: str
    category: str = "unknown"
    status: str
    created_at: str
    updated_at: str
    timestamp: str = ""
    service: str = ""
    affected_service: str = ""
    affected_resources: list[Any] = Field(default_factory=list)
    alerts: list[Any] = Field(default_factory=list)
    logs: Any = ""
    observations: list[Any] = Field(default_factory=list)
    suspected_root_cause: Optional[str] = None
    root_cause_confidence: Optional[float] = None
    recommended_actions: list[ActionOut] = Field(default_factory=list)
    approved_action: Optional[str] = None
    execution_result: Optional[dict[str, Any]] = None
    verification_result: Optional[dict[str, Any]] = None
    timeline: Optional[list[dict[str, Any]]] = None
    agent_analysis: Optional[dict[str, Any]] = None
    investigation: Optional[dict[str, Any]] = None
    resolution: Optional[dict[str, Any]] = None
    postMortem: Optional[dict[str, Any]] = None
    knowledgeEntry: Optional[dict[str, Any]] = None
    resolution_summary: Optional[str] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[str] = None
    scenario_id: Optional[str] = None


class IncidentListItem(BaseModel):
    incident_id: str
    id: str = ""
    title: str
    severity: str
    status: str
    affected_service: str
    service: str = ""
    created_at: str
    updated_at: str
    timestamp: str = ""
    category: str = "unknown"
    priority: str = "P2"
    symptoms: str = ""


class ResolveRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    summary: str = Field(default="", max_length=4000)
    resolvedBy: Optional[str] = "Lead SRE"
    resolved_by: Optional[str] = None
    escalate: bool = False

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, values: Any) -> Any:
        if isinstance(values, dict):
            rb = values.get("resolvedBy") or values.get("resolved_by") or "Lead SRE"
            values["resolvedBy"] = rb
            values["resolved_by"] = rb
        return values


class UpdateStepRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    stepId: str = ""
    step_id: Optional[str] = None
    status: str  # pending | in_progress | done | skipped
    notes: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, values: Any) -> Any:
        if isinstance(values, dict):
            sid = values.get("stepId") or values.get("step_id") or values.get("id") or ""
            values["stepId"] = sid
            values["step_id"] = sid
        return values


class PostmortemRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    rootCause: str = ""
    root_cause: Optional[str] = None
    impact: str = ""
    timeline: str = ""
    actionItems: list[str] = Field(default_factory=list)
    action_items: Optional[list[str]] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, values: Any) -> Any:
        if isinstance(values, dict):
            rc = values.get("rootCause") or values.get("root_cause") or ""
            values["rootCause"] = rc
            values["root_cause"] = rc
            ai = values.get("actionItems") or values.get("action_items") or []
            values["actionItems"] = ai
            values["action_items"] = ai
        return values


class RetainRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    insight: str
    tags: list[str] = Field(default_factory=list)

