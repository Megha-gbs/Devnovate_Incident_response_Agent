"""Turn collected context into a validated AgentAnalysis."""

from __future__ import annotations

import json
import logging
from typing import Any

from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.agents.fallback import heuristic_analysis
from app.core.exceptions import GroqParseError, GroqUnavailableError
from app.core.security import ALLOWED_REMEDIATIONS, assert_action_allowed, risk_for_action
from app.models.incident import Incident
from app.schemas.analysis import AgentAnalysis
from app.services.groq_service import groq_service
from app.services.incident_service import incident_service

logger = logging.getLogger(__name__)


class Analyzer:
    def analyze(self, db: Session, incident: Incident, context: dict[str, Any]) -> AgentAnalysis:
        incident_service.transition(db, incident, "ANALYZING", actor="analyzer", commit=False)

        groq_used = False
        fallback_used = False
        analysis: AgentAnalysis

        try:
            raw = groq_service.complete_json(json.dumps(context, default=str))
            analysis = AgentAnalysis.model_validate(raw)
            groq_used = True
        except (GroqUnavailableError, GroqParseError, ValidationError) as exc:
            logger.warning("Groq analysis unavailable or invalid (%s); using fallback", exc)
            analysis = heuristic_analysis(context)
            fallback_used = True

        analysis = self._sanitize_actions(analysis)
        payload = analysis.model_dump()
        payload["groq_used"] = groq_used
        payload["fallback_used"] = fallback_used

        incident.agent_analysis = payload
        incident.observations = analysis.observations
        incident.suspected_root_cause = analysis.suspected_root_cause
        incident.root_cause_confidence = analysis.confidence
        incident.severity = analysis.severity.value
        incident.category = analysis.incident_type or incident.category

        incident_service.add_timeline(
            db,
            incident,
            event="ANALYSIS_COMPLETED",
            actor="analyzer",
            result=analysis.summary[:240],
            extra={
                "confidence": analysis.confidence,
                "groq_used": groq_used,
                "fallback_used": fallback_used,
            },
        )
        db.commit()
        return analysis

    def _sanitize_actions(self, analysis: AgentAnalysis) -> AgentAnalysis:
        cleaned = []
        for draft in analysis.recommended_actions:
            try:
                action_type = assert_action_allowed(draft.action_type)
            except Exception:
                if draft.action_type not in ALLOWED_REMEDIATIONS:
                    continue
                action_type = draft.action_type
            draft.action_type = action_type
            draft.risk = risk_for_action(action_type)
            draft.requires_approval = True
            cleaned.append(draft)
        if not cleaned:
            cleaned = heuristic_analysis({"affected_service": "unknown"}).recommended_actions
        analysis.recommended_actions = cleaned
        analysis.requires_human_approval = True
        return analysis


analyzer = Analyzer()
