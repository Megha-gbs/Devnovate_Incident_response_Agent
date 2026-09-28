"""Log lookup against the simulated world plus persisted incident logs."""

from app.services.simulation import simulation_store


class LogService:
    def collect_for_incident(
        self, incident_id: str, scenario_id: str | None, service: str | None = None
    ) -> list[dict]:
        world = simulation_store.world_or_default(incident_id, scenario_id)
        if service:
            return world.search_logs(service=service)
        return list(world.logs)


log_service = LogService()
