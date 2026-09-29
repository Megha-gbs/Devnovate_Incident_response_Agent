"""Action approval / execution schemas."""

from pydantic import BaseModel, Field


class ApprovalRequest(BaseModel):
    approved_by: str = Field(default="operator", max_length=80)
    comment: str = Field(default="", max_length=2000)


class RejectRequest(BaseModel):
    rejected_by: str = Field(default="operator", max_length=80)
    reason: str = Field(default="Rejected by operator", max_length=2000)


class AlertIngest(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    message: str = Field(..., min_length=3, max_length=4000)
    source: str = Field(default="alert-manager", max_length=80)
    severity: str = Field(default="HIGH", max_length=20)
    service: str = Field(default="", max_length=120)
    labels: dict = Field(default_factory=dict)
    scenario_id: str | None = None
