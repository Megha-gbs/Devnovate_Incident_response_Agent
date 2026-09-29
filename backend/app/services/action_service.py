"""Execute allowlisted remediations against the simulation (never a shell)."""

from typing import Any

from app.core.exceptions import ActionNotAllowedError
from app.core.security import assert_action_allowed
from app.services.simulation import SimulationWorld


class ActionService:
    def execute(
        self, world: SimulationWorld, action_type: str, target: str
    ) -> dict[str, Any]:
        allowed = assert_action_allowed(action_type)
        handlers = {
            "restart_service": lambda: world.restart_service(target),
            "rollback_deployment": lambda: world.rollback_deployment(target),
            "scale_service": lambda: world.scale_service(target),
            "increase_db_pool": lambda: world.increase_db_pool(target),
            "block_ip": lambda: world.block_ip(target),
            "clear_cache": lambda: world.clear_cache(target),
            "recycle_workers": lambda: world.recycle_workers(target),
            "rotate_credentials": lambda: world.rotate_credentials(target),
        }
        handler = handlers.get(allowed)
        if not handler:
            raise ActionNotAllowedError(f"No handler for {allowed}")
        result = handler()
        if not result.get("ok"):
            result["executed"] = False
            return result
        result["executed"] = True
        return result


action_service = ActionService()
