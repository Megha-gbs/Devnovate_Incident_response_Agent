"""Structured AI analysis schemas. Supports both internal agent format and frontend Investigation contract."""

from typing import Any, List, Optional
from pydantic import BaseModel, Field, field_validator
from app.schemas.common import Severity


class EvidenceItem(BaseModel):
    kind: str = Field(description="observed | inferred | hypothesis")
    statement: str
    source: str = "investigation"

    @field_validator("kind")
    @classmethod
    def validate_kind(cls, value: str) -> str:
        allowed = {"observed", "inferred", "hypothesis"}
        lowered = value.lower()
        if lowered not in allowed:
            return "hypothesis"
        return lowered


class RecommendedActionDraft(BaseModel):
    action_type: str
    target: str = ""
    reason: str = ""
    risk: str = "medium"
    expected_result: str = ""
    requires_approval: bool = True


class AgentAnalysis(BaseModel):
    summary: str
    incident_type: str = "unknown"
    severity: Severity = Severity.MEDIUM
    observations: list[str] = Field(default_factory=list)
    suspected_root_cause: str = "Insufficient evidence for a confirmed root cause."
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    evidence: list[EvidenceItem] = Field(default_factory=list)
    recommended_actions: list[RecommendedActionDraft] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    requires_human_approval: bool = True
    reasoning_notes: str = ""

    @field_validator("confidence", mode="before")
    @classmethod
    def clamp_confidence(cls, value: Any) -> float:
        try:
            number = float(value)
        except (TypeError, ValueError):
            return 0.0
        return max(0.0, min(1.0, number))


# Canonical Frontend Contracts
class HypothesisOut(BaseModel):
    id: str
    description: str
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    supporting_evidence: list[str] = Field(default_factory=list)
    title: Optional[str] = None
    citations: list[str] = Field(default_factory=list)


class InvestigationStepOut(BaseModel):
    id: str
    action: str
    rationale: str
    status: str = "pending"  # pending | in_progress | done | skipped
    order: int = 1
    notes: Optional[str] = None
    citations: list[str] = Field(default_factory=list)


class MemoryOut(BaseModel):
    id: str
    incidentId: str
    title: str
    service: str
    severity: str
    similarityScore: float
    relevanceExplanation: str
    resolvedAt: str
    resolution: str
    rootCause: Optional[str] = None


class TimelineEntryOut(BaseModel):
    id: str
    timestamp: str
    actor: str  # system | user | ai
    event: str
    detail: Optional[str] = None


class Investigation(BaseModel):
    id: str
    incidentId: str
    hypotheses: list[HypothesisOut] = Field(default_factory=list)
    steps: list[InvestigationStepOut] = Field(default_factory=list)
    timeline: list[TimelineEntryOut] = Field(default_factory=list)
    memory: list[MemoryOut] = Field(default_factory=list)
    status: str = "complete"  # pending | running | complete | error
    createdAt: str
    summary: str = ""
    memory_used: bool = False
    memory_count: int = 0
    memory_references: list[str] = Field(default_factory=list)
    memory_error: Optional[str] = None


class AnalysisOut(BaseModel):
    incident_id: str
    status: str
    analysis: Optional[AgentAnalysis] = None
    investigation: Optional[Investigation] = None
    groq_used: bool = False
    fallback_used: bool = False
