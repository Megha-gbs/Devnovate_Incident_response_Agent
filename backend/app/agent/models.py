from typing import List, Optional, Union, Literal, Any, Dict
from pydantic import BaseModel, Field, model_validator


class Incident(BaseModel):
    """Input representation of an active incident."""
    id: str = Field(..., description="Unique incident identifier, e.g., INC-DEMO-001")
    title: str = Field(..., description="Short headline of the incident")
    severity: str = Field(default="SEV-2", description="Incident severity level, e.g., SEV-1, SEV-2")
    service: str = Field(..., description="Target service name, e.g., payments-api")
    symptoms: Union[List[str], str] = Field(..., description="Observed symptoms or failure modes")
    error_summary: Optional[str] = Field(default=None, description="Summary of error messages, stack traces, or alerts")
    recent_deployment: Optional[str] = Field(default=None, description="Details of any recent deployment or release")
    config_changes: Optional[str] = Field(default=None, description="Details of configuration or environment modifications")
    affected_components: Optional[List[str]] = Field(default=None, description="List of downstream/upstream affected components")

    def formatted_symptoms(self) -> str:
        if isinstance(self.symptoms, list):
            return ", ".join(self.symptoms)
        return str(self.symptoms)


class ResolvedIncident(BaseModel):
    """Representation of an approved resolved incident for post-mortem retention."""
    incident_id: str = Field(..., description="Unique incident identifier")
    service: str = Field(..., description="Service name")
    title: Optional[str] = Field(default=None, description="Incident title")
    symptoms: Union[List[str], str] = Field(default="", description="Observed symptoms")
    recent_change: Optional[str] = Field(default=None, description="Recent deployment or configuration changes")
    root_cause: str = Field(..., description="Verified root cause of the incident")
    failed_attempts: Optional[Union[List[str], str]] = Field(default=None, description="Actions that were attempted but failed")
    successful_resolution: str = Field(..., description="Steps that resolved the incident")
    lessons_learned: Optional[Union[List[str], str]] = Field(default=None, description="Key takeaways and preventative measures")
    post_mortem: Optional[str] = Field(default=None, description="Additional post-mortem documentation or context")


class Hypothesis(BaseModel):
    """A ranked candidate root-cause hypothesis."""
    title: str = Field(..., description="Hypothesis headline")
    confidence: Literal["high", "medium", "low"] = Field(..., description="Confidence rating: high, medium, or low")
    reasoning: str = Field(..., description="Detailed technical explanation and evidence evaluation")
    citations: List[str] = Field(default_factory=list, description="Explicit citations to historical memory IDs")

    @model_validator(mode="before")
    @classmethod
    def handle_reason_alias(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "reason" in values and "reasoning" not in values:
                values["reasoning"] = values["reason"]
        return values

    @property
    def reason(self) -> str:
        """Alias for reasoning."""
        return self.reasoning


class InvestigationStep(BaseModel):
    """A recommended actionable step for the on-call engineer."""
    step: Union[int, str] = Field(..., description="Step order or identifier")
    description: str = Field(default="", description="Concrete command or inspection action")
    why: str = Field(default="", description="Why this step is critical and what signal it provides")
    citations: List[str] = Field(default_factory=list, description="Citations to past memory IDs if informed by historical resolution")

    @model_validator(mode="before")
    @classmethod
    def handle_aliases(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "reason" in values and not values.get("why"):
                values["why"] = values["reason"]
            if "description" not in values and "action" in values:
                values["description"] = values["action"]
            if not values.get("description") and values.get("why"):
                values["description"] = values.get("why")
        return values

    @property
    def reason(self) -> str:
        """Alias for why."""
        return self.why


class IncidentAnalysis(BaseModel):
    """Structured response from the Incident Agent."""
    summary: str = Field(..., description="High-level technical assessment of the incident")
    hypotheses: List[Hypothesis] = Field(..., description="Ranked candidate root cause hypotheses")
    investigation_steps: List[InvestigationStep] = Field(..., description="Prioritized investigation steps")
    memory_used: bool = Field(..., description="Whether historical memories were utilized in reasoning")
    memory_count: int = Field(default=0, description="Total number of memories recalled and evaluated")
    memory_references: List[str] = Field(default_factory=list, description="List of historical memory IDs referenced")
    memory_error: Optional[str] = Field(default=None, description="Any error encountered during memory recall, if applicable")
    recall_query: Optional[str] = Field(default=None, description="The query used to retrieve historical memories")


# Alias for backward compatibility
IncidentAnalysisResponse = IncidentAnalysis
