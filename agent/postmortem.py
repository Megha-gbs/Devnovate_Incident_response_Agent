import logging
from typing import Union, Dict, Any
from agent.models import ResolvedIncident
from hindsight.memory import retain_resolved_incident as hindsight_retain_resolved

logger = logging.getLogger(__name__)


def retain_resolved_incident(
    resolved_incident: Union[ResolvedIncident, Dict[str, Any]],
    bank_id: str = None
) -> Dict[str, Any]:
    """
    Retains an approved resolved incident in Hindsight.
    Sanitizes content, formats a clean post-mortem structure, and stores it in Hindsight memory.
    """
    if isinstance(resolved_incident, dict):
        resolved_obj = ResolvedIncident(**resolved_incident)
    else:
        resolved_obj = resolved_incident

    try:
        result = hindsight_retain_resolved(resolved_obj, bank_id=bank_id)
        return {
            "success": True,
            "incident_id": resolved_obj.incident_id,
            "service": resolved_obj.service,
            "message": f"Post-mortem for {resolved_obj.incident_id} successfully retained in Hindsight.",
            "raw_result": result
        }
    except Exception as e:
        logger.warning(f"Failed to retain resolved incident {resolved_obj.incident_id}: {e}")
        return {
            "success": False,
            "incident_id": resolved_obj.incident_id,
            "service": resolved_obj.service,
            "error": f"Retention failed: {type(e).__name__} - {str(e)}"
        }
