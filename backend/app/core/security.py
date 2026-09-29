"""Small security helpers used at action boundaries."""

from app.core.exceptions import ActionNotAllowedError

# Only these remediation types can ever run. The LLM cannot invent a new tool.
ALLOWED_REMEDIATIONS = {
    "restart_service",
    "rollback_deployment",
    "scale_service",
    "increase_db_pool",
    "block_ip",
    "clear_cache",
    "recycle_workers",
    "rotate_credentials",
}

HIGH_RISK_ACTIONS = {
    "rollback_deployment",
    "block_ip",
    "rotate_credentials",
}


def assert_action_allowed(action_type: str) -> str:
    normalized = (action_type or "").strip()
    if normalized not in ALLOWED_REMEDIATIONS:
        raise ActionNotAllowedError(
            f"Action '{action_type}' is not in the allowlist"
        )
    return normalized


def risk_for_action(action_type: str) -> str:
    if action_type in HIGH_RISK_ACTIONS:
        return "high"
    if action_type in {"restart_service", "scale_service", "increase_db_pool", "recycle_workers"}:
        return "medium"
    return "low"
