"""search_logs tool — mock telemetry only."""

from app.services.simulation import simulation_store


def search_logs(
    incident_id: str,
    scenario_id: str | None,
    query: str = "",
    service: str | None = None,
    limit: int = 50,
) -> list[dict]:
    world = simulation_store.world_or_default(incident_id, scenario_id)
    return world.search_logs(query=query, service=service, limit=limit)
