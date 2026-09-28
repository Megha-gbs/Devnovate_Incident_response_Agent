"""get_service_status tool."""

from app.services.simulation import simulation_store


def get_service_status(
    incident_id: str, scenario_id: str | None, service: str | None = None
) -> dict:
    world = simulation_store.world_or_default(incident_id, scenario_id)
    return world.get_service_status(service)
