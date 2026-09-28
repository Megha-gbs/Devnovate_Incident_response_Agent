import os
import logging
from typing import Union, Dict, Any, Optional
from dotenv import load_dotenv
from groq import Groq

from agent.models import Incident, ResolvedIncident, IncidentAnalysis
from agent.query_builder import build_recall_query
from agent.reasoning import execute_reasoning
from hindsight.memory import recall_memories, retain_postmortem
from hindsight.formatter import format_memory_context

load_dotenv()
logger = logging.getLogger(__name__)


class IncidentAgent:
    """
    Core Incident Agent orchestrator.
    Combines high-signal memory retrieval via Hindsight Cloud and deep diagnostic reasoning via Groq LLM.
    """

    def __init__(
        self,
        groq_api_key: Optional[str] = None,
        model: str = "openai/gpt-oss-120b",
        bank_id: Optional[str] = None
    ):
        self.groq_api_key = groq_api_key or os.environ.get("GROQ_API_KEY")
        self.model = model
        self.bank_id = bank_id
        self._groq_client: Optional[Groq] = None

    def _get_groq_client(self) -> Optional[Groq]:
        if self._groq_client is not None:
            return self._groq_client
        if self.groq_api_key:
            try:
                self._groq_client = Groq(api_key=self.groq_api_key)
            except Exception as e:
                logger.warning(f"Could not initialize Groq client: {e}")
        return self._groq_client

    def analyze_incident(self, incident: Union[Incident, Dict[str, Any]]) -> IncidentAnalysis:
        """
        Main analysis flow:
        1. Parse input into Incident model
        2. Construct semantic recall query
        3. Recall historical incident memories from Hindsight
        4. Format memories for LLM prompt context
        5. Reason using Groq LLM and generate ranked hypotheses with citations
        6. Return verified IncidentAnalysis
        """
        if isinstance(incident, dict):
            incident_obj = Incident(**incident)
        else:
            incident_obj = incident

        # 1. Build recall query
        query = build_recall_query(incident_obj)

        # 2. Recall memories from Hindsight
        recall_res = recall_memories(query=query, bank_id=self.bank_id)

        # 3. Format recalled memories
        memory_context = format_memory_context(recall_res)
        recalled_ids = [m.id for m in recall_res.memories if m.id]

        # 4. Reason with Groq
        groq_client = self._get_groq_client()
        analysis = execute_reasoning(
            incident=incident_obj,
            memory_context=memory_context,
            memory_count=recall_res.memory_count,
            recalled_memory_ids=recalled_ids,
            groq_client=groq_client,
            model=self.model,
            recall_query=query,
            memory_error=recall_res.memory_error
        )

        return analysis

    def retain_postmortem(
        self,
        incident: Union[Incident, Dict[str, Any]],
        postmortem: Optional[Union[ResolvedIncident, Dict[str, Any], str]] = None
    ) -> Dict[str, Any]:
        """
        Retains an approved incident post-mortem in the Hindsight memory bank.
        """
        return retain_postmortem(
            incident=incident,
            postmortem=postmortem,
            bank_id=self.bank_id
        )


# Global default agent instance
_default_agent = IncidentAgent()


def analyze_incident(incident: Union[Incident, Dict[str, Any]]) -> IncidentAnalysis:
    """
    Public API interface for Smruthi's backend service.
    Accepts an Incident object or dictionary and returns a structured IncidentAnalysis.
    """
    return _default_agent.analyze_incident(incident)


def retain_approved_postmortem(
    incident: Union[Incident, Dict[str, Any]],
    postmortem: Optional[Union[ResolvedIncident, Dict[str, Any], str]] = None,
    bank_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Public API interface for retaining approved post-mortems in Hindsight.
    """
    return retain_postmortem(incident=incident, postmortem=postmortem, bank_id=bank_id)
