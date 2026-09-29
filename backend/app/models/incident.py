"""Incident ORM model."""

from datetime import datetime

from sqlalchemy import DateTime, Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.db.base import Base
from app.utils.ids import utc_now


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    symptoms: Mapped[str] = mapped_column(Text, default="")
    source: Mapped[str] = mapped_column(String(80), default="manual")
    severity: Mapped[str] = mapped_column(String(20), default="MEDIUM")
    priority: Mapped[str] = mapped_column(String(20), default="P2")
    category: Mapped[str] = mapped_column(String(80), default="unknown")
    status: Mapped[str] = mapped_column(String(32), default="NEW", index=True)
    affected_service: Mapped[str] = mapped_column(String(120), default="")
    affected_resources: Mapped[list] = mapped_column(JSON, default=list)
    alerts: Mapped[list] = mapped_column(JSON, default=list)
    logs: Mapped[list] = mapped_column(JSON, default=list)
    observations: Mapped[list] = mapped_column(JSON, default=list)
    suspected_root_cause: Mapped[str | None] = mapped_column(Text, nullable=True)
    root_cause_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    approved_action_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    execution_result: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    verification_result: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    agent_analysis: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    investigation_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    postmortem_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    knowledge_entry: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    resolution_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolved_by: Mapped[str | None] = mapped_column(String(120), nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    scenario_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )

    actions = relationship(
        "RecommendedAction",
        back_populates="incident",
        cascade="all, delete-orphan",
        order_by="RecommendedAction.created_at",
    )
    timeline = relationship(
        "TimelineEvent",
        back_populates="incident",
        cascade="all, delete-orphan",
        order_by="TimelineEvent.created_at",
    )
