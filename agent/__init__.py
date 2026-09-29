"""
Incident Agent Intelligence Module
Provides incident analysis, root-cause hypotheses ranking, investigation recommendation,
query construction, and post-mortem retention powered by Hindsight and Groq.
"""

from agent.models import (
    Incident,
    ResolvedIncident,
    Hypothesis,
    InvestigationStep,
    IncidentAnalysis,
    IncidentAnalysisResponse,
)
from agent.query_builder import build_recall_query
from agent.service import (
    IncidentAgent,
    analyze_incident,
    retain_approved_postmortem,
)
from agent.postmortem import retain_resolved_incident
from agent.exceptions import (
    AgentError,
    AgentReasoningError,
    GroqAuthenticationError,
    GroqServiceUnavailableError,
    InvalidPromptError,
)

__all__ = [
    "Incident",
    "ResolvedIncident",
    "Hypothesis",
    "InvestigationStep",
    "IncidentAnalysis",
    "IncidentAnalysisResponse",
    "build_recall_query",
    "IncidentAgent",
    "analyze_incident",
    "retain_approved_postmortem",
    "retain_resolved_incident",
    "AgentError",
    "AgentReasoningError",
    "GroqAuthenticationError",
    "GroqServiceUnavailableError",
    "InvalidPromptError",
]
