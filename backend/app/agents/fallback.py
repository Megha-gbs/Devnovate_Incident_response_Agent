"""Heuristic analysis used when Groq is unavailable or returns invalid JSON.

This keeps the hackathon demo runnable without an API key while still
producing structured, evidence-based output — not a free-form chat answer.
"""

from __future__ import annotations

from typing import Any

from app.core.security import assert_action_allowed, risk_for_action
from app.schemas.analysis import AgentAnalysis, EvidenceItem, RecommendedActionDraft
from app.schemas.common import Severity
from app.services.simulation import SCENARIOS


def heuristic_analysis(context: dict[str, Any]) -> AgentAnalysis:
    scenario_id = context.get("scenario_id")
    spec = SCENARIOS.get(scenario_id or "", {})
    logs = context.get("logs") or []
    service_status = context.get("service_status") or {}
    metrics = context.get("metrics") or {}
    title = context.get("title") or spec.get("title") or "Incident"

    log_messages = [str(row.get("message", "")) for row in logs]
    blob = " ".join(log_messages).lower()

    observations: list[str] = []
    evidence: list[EvidenceItem] = []

    error_logs = [row for row in logs if str(row.get("level", "")).upper() in {"ERROR", "FATAL"}]
    if error_logs:
        sample = error_logs[0]
        statement = (
            f"Observed {len(error_logs)} ERROR/FATAL log lines. "
            f"Example: {sample.get('service')}: {sample.get('message')}"
        )
        observations.append(statement)
        evidence.append(EvidenceItem(kind="observed", statement=statement, source="logs"))

    if isinstance(metrics, dict) and metrics.get("found"):
        err = metrics.get("error_rate")
        if err is not None:
            statement = f"Observed error_rate={err} on {metrics.get('service')}."
            observations.append(statement)
            evidence.append(EvidenceItem(kind="observed", statement=statement, source="metrics"))

    services = service_status.get("services") or {}
    degraded = [name for name, data in services.items() if data.get("status") != "healthy"]
    if degraded:
        statement = f"Observed degraded services: {', '.join(degraded)}."
        observations.append(statement)
        evidence.append(EvidenceItem(kind="observed", statement=statement, source="service_status"))

    rec = spec.get("recommended_action") or {
        "action_type": "restart_service",
        "target": context.get("affected_service") or "unknown-service",
        "reason": "Heuristic fallback: restart is a common mitigation pending better evidence.",
        "expected_result": "Service health improves if the fault was transient.",
    }

    try:
        action_type = assert_action_allowed(rec["action_type"])
    except Exception:
        action_type = "restart_service"

    hypothesis = spec.get("expected_hypothesis")
    if not hypothesis:
        if "pool" in blob or "connection" in blob:
            hypothesis = (
                "The service may be failing because a dependency connection pool is exhausted. "
                "This is a hypothesis, not a confirmed root cause."
            )
        elif "cpu" in blob:
            hypothesis = (
                "The service may be CPU-saturated. This is a hypothesis based on CPU-related logs."
            )
        else:
            hypothesis = (
                f"A fault in {context.get('affected_service') or 'the affected service'} is likely, "
                "but the available evidence is not enough to confirm a root cause."
            )

    evidence.append(
        EvidenceItem(kind="hypothesis", statement=hypothesis, source="heuristic-analyzer")
    )

    severity = _severity(spec.get("severity") or context.get("severity") or "HIGH")
    try:
        allowed_action = RecommendedActionDraft(
            action_type=action_type,
            target=rec.get("target") or "",
            reason=rec.get("reason") or "",
            risk=risk_for_action(action_type),
            expected_result=rec.get("expected_result") or "",
            requires_approval=True,
        )
    except Exception:
        allowed_action = RecommendedActionDraft(
            action_type="restart_service",
            target=context.get("affected_service") or "",
            reason="Fallback recommendation",
            risk="medium",
            expected_result="Service recovers if the issue was transient",
            requires_approval=True,
        )

    return AgentAnalysis(
        summary=(
            f"{title}. Investigation collected {len(logs)} log lines. "
            "Root cause below is a hypothesis grounded in observed evidence."
        ),
        incident_type=spec.get("category") or context.get("category") or "unknown",
        severity=severity,
        observations=observations or ["No structured observations could be extracted."],
        suspected_root_cause=hypothesis,
        confidence=0.72 if spec else 0.45,
        evidence=evidence,
        recommended_actions=[allowed_action],
        risks=[
            "Remediation may cause brief additional disruption.",
            "Hypothesis could be wrong if a different dependency is actually at fault.",
        ],
        requires_human_approval=True,
        reasoning_notes="Generated by heuristic fallback because Groq was not used or failed.",
    )


def _severity(value: str) -> Severity:
    try:
        return Severity(str(value).upper())
    except ValueError:
        return Severity.HIGH
