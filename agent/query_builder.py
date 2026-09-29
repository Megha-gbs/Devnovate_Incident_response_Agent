from typing import Union, Dict, Any
from agent.models import Incident


def build_recall_query(incident: Union[Incident, Dict[str, Any]]) -> str:
    """
    Constructs a high-signal search query from incident attributes to recall relevant past incidents.
    Prioritizes:
    - Service name
    - Observed symptoms
    - Error patterns / summary
    - Recent deployment / changes
    - Configuration modifications
    - Affected components
    """
    if isinstance(incident, dict):
        service = incident.get("service", "").strip()
        symptoms = incident.get("symptoms", "")
        error_summary = incident.get("error_summary", "")
        recent_deployment = incident.get("recent_deployment", "")
        config_changes = incident.get("config_changes", "")
        affected_components = incident.get("affected_components", [])
    else:
        service = incident.service.strip()
        symptoms = incident.symptoms
        error_summary = incident.error_summary or ""
        recent_deployment = incident.recent_deployment or ""
        config_changes = incident.config_changes or ""
        affected_components = incident.affected_components or []

    # Normalize symptoms
    if isinstance(symptoms, list):
        symptoms_str = " ".join(str(s) for s in symptoms if s)
    else:
        symptoms_str = str(symptoms).strip()

    # Normalize affected components
    if isinstance(affected_components, list):
        components_str = " ".join(str(c) for c in affected_components if c)
    else:
        components_str = str(affected_components).strip()

    query_parts = []

    if service:
        query_parts.append(service)

    if symptoms_str:
        query_parts.append(symptoms_str)

    if error_summary:
        query_parts.append(error_summary)

    if recent_deployment:
        query_parts.append(f"deployment {recent_deployment}")

    if config_changes:
        query_parts.append(f"config {config_changes}")

    if components_str:
        query_parts.append(components_str)

    query = " ".join(query_parts).strip()

    # Fallback to generic service if query is empty
    if not query:
        query = service or "system incident"

    return query
