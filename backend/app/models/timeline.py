"""Audit / timeline events for an incident."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.db.base import Base
from app.utils.ids import utc_now


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    incident_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("incidents.id"), index=True, nullable=False
    )
    actor: Mapped[str] = mapped_column(String(80), default="incident-agent")
    event: Mapped[str] = mapped_column(String(80), nullable=False)
    action: Mapped[str | None] = mapped_column(String(80), nullable=True)
    result: Mapped[str | None] = mapped_column(Text, nullable=True)
    extra: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, index=True
    )

    incident = relationship("Incident", back_populates="timeline")
