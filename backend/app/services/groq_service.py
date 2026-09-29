"""Isolated Groq client. API routes and agents never talk to Groq except through this module."""

from __future__ import annotations

import logging
from typing import Any

from app.core.config import get_settings
from app.core.exceptions import GroqParseError, GroqUnavailableError
from app.utils.ids import extract_json_object

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an incident-response analyst inside an automated IR platform.

Rules:
- Return ONLY a JSON object. No markdown, no extra keys that contradict the schema.
- Distinguish observed evidence from hypotheses. Never claim a root cause is confirmed.
- Do not invent logs, metrics, or services that were not provided in the user payload.
- Recommended actions must use only these action_type values:
  restart_service, rollback_deployment, scale_service, increase_db_pool,
  block_ip, clear_cache, recycle_workers, rotate_credentials
- Dangerous remediations always set requires_human_approval=true.
- confidence is 0.0-1.0 reflecting evidence quality, not optimism.

JSON schema:
{
  "summary": "string",
  "incident_type": "string",
  "severity": "LOW|MEDIUM|HIGH|CRITICAL",
  "observations": ["string"],
  "suspected_root_cause": "string (hypothesis, not a confirmation)",
  "confidence": 0.0,
  "evidence": [{"kind": "observed|inferred|hypothesis", "statement": "string", "source": "string"}],
  "recommended_actions": [
    {
      "action_type": "increase_db_pool",
      "target": "payments-db",
      "reason": "string",
      "risk": "low|medium|high",
      "expected_result": "string",
      "requires_approval": true
    }
  ],
  "risks": ["string"],
  "requires_human_approval": true,
  "reasoning_notes": "string"
}
"""


class GroqService:
    def complete_json(self, user_payload: str, system_prompt: str = SYSTEM_PROMPT) -> dict[str, Any]:
        settings = get_settings()
        if not settings.groq_configured:
            raise GroqUnavailableError(
                "GROQ_API_KEY is not set. Heuristic fallback will be used."
            )

        try:
            from groq import Groq
        except ImportError as exc:
            raise GroqUnavailableError("groq package is not installed") from exc

        client = Groq(api_key=settings.groq_api_key)
        try:
            completion = client.chat.completions.create(
                model=settings.groq_model,
                temperature=0.1,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_payload},
                ],
                response_format={"type": "json_object"},
            )
        except Exception as exc:  # noqa: BLE001 - surface as service error, never leak key
            logger.exception("Groq request failed")
            raise GroqUnavailableError("Groq request failed") from exc

        content = ""
        try:
            content = completion.choices[0].message.content or ""
        except (IndexError, AttributeError) as exc:
            raise GroqParseError("Groq returned an empty completion") from exc

        try:
            return extract_json_object(content)
        except (ValueError, TypeError) as exc:
            raise GroqParseError("Groq response was not valid JSON") from exc


groq_service = GroqService()
