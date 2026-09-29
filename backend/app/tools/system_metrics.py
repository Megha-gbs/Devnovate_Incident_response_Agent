"""get_recent_metrics tool."""

from app.services.simulation import simulation_store


def get_recent_metrics(incident_id: str, scenario_id: str | None, service: str) -> dict:
    world = simulation_store.world_or_default(incident_id, scenario_id)
    return world.get_metrics(service)
