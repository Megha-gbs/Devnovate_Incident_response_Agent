"""Incident identifiers and JSON helpers."""

import json
import re
import uuid
from datetime import datetime, timezone


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def new_incident_id() -> str:
    return f"INC-{uuid.uuid4().hex[:8].upper()}"


def new_action_id() -> str:
    return f"ACT-{uuid.uuid4().hex[:8].upper()}"


def new_event_id() -> str:
    return f"EVT-{uuid.uuid4().hex[:8].upper()}"


def extract_json_object(text: str) -> dict:
    """Parse a JSON object from an LLM string, including markdown fences."""
    if not text or not text.strip():
        raise ValueError("Empty LLM response")

    stripped = text.strip()
    fenced = re.search(r"```(?:json)?\s*(\{.*\})\s*```", stripped, re.DOTALL)
    if fenced:
        stripped = fenced.group(1)

    try:
        parsed = json.loads(stripped)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    start = stripped.find("{")
    end = stripped.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("No JSON object found in LLM response")

    parsed = json.loads(stripped[start : end + 1])
    if not isinstance(parsed, dict):
        raise ValueError("LLM JSON was not an object")
    return parsed
