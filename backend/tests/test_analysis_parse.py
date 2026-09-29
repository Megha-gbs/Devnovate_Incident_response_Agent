"""Structured AI output parsing tests."""

import pytest

from app.schemas.analysis import AgentAnalysis
from app.utils.ids import extract_json_object


def test_extract_json_object_plain() -> None:
    parsed = extract_json_object('{"summary": "ok", "confidence": 0.2}')
    assert parsed["summary"] == "ok"


def test_extract_json_object_fenced() -> None:
    text = """```json
{"summary": "fenced", "incident_type": "availability"}
```"""
    parsed = extract_json_object(text)
    assert parsed["incident_type"] == "availability"


def test_extract_json_object_rejects_empty() -> None:
    with pytest.raises(ValueError):
        extract_json_object("   ")


def test_agent_analysis_validates_and_clamps() -> None:
    analysis = AgentAnalysis.model_validate(
        {
            "summary": "Observed 503s",
            "severity": "HIGH",
            "confidence": 5,
            "evidence": [{"kind": "nope", "statement": "x"}],
            "recommended_actions": [
                {
                    "action_type": "increase_db_pool",
                    "target": "payments-db",
                    "reason": "pool full",
                    "risk": "medium",
                    "expected_result": "503s drop",
                    "requires_approval": True,
                }
            ],
        }
    )
    assert analysis.confidence == 1.0
    assert analysis.evidence[0].kind == "hypothesis"


def test_malformed_analysis_rejected() -> None:
    with pytest.raises(Exception):
        AgentAnalysis.model_validate({"confidence": 0.1})
