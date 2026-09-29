"""Remediation tools. These never run a shell command."""

from app.services.action_service import action_service
from app.services.simulation import simulation_store


def run_remediation(
    incident_id: str, scenario_id: str | None, action_type: str, target: str
) -> dict:
    world = simulation_store.world_or_default(incident_id, scenario_id)
    return action_service.execute(world, action_type, target)
