"""Recommended / executed remediation actions."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.db.base import Base
from app.utils.ids import utc_now


class RecommendedAction(Base):
    __tablename__ = "recommended_actions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    incident_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("incidents.id"), index=True, nullable=False
    )
    action_type: Mapped[str] = mapped_column(String(80), nullable=False)
    target: Mapped[str] = mapped_column(String(120), default="")
    reason: Mapped[str] = mapped_column(Text, default="")
    risk: Mapped[str] = mapped_column(String(20), default="medium")
    expected_result: Mapped[str] = mapped_column(Text, default="")
    requires_approval: Mapped[bool] = mapped_column(default=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    execution_result: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )

    incident = relationship("Incident", back_populates="actions")
