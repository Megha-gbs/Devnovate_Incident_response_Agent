"""Deployment and history lookup tools."""

from app.services.simulation import simulation_store


def get_deployment_info(incident_id: str, scenario_id: str | None, service: str) -> dict:
    world = simulation_store.world_or_default(incident_id, scenario_id)
    return world.get_deployment(service)


def get_incident_history(incident_id: str, scenario_id: str | None) -> list[dict]:
    world = simulation_store.world_or_default(incident_id, scenario_id)
    return world.get_history()
