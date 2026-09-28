"""Structured AI analysis schema. This is the contract the LLM must satisfy."""

from typing import Any

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


class AnalysisOut(BaseModel):
    incident_id: str
    status: str
    analysis: AgentAnalysis | None
    groq_used: bool = False
    fallback_used: bool = False
