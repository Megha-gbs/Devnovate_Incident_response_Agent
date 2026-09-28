import os
import json
import logging
from typing import Union, Dict, Any, Optional
from dotenv import load_dotenv
from groq import Groq

from agent.models import (
    Incident,
    Hypothesis,
    InvestigationStep,
    IncidentAnalysisResponse,
)
from agent.query_builder import build_recall_query
from hindsight.memory import recall_memories, format_recalled_memories, RecallFetchResult

load_dotenv()
logger = logging.getLogger(__name__)

DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b"


class IncidentAgent:
    """
    Intelligent Incident Response Agent.
    Orchestrates historical incident recall via Hindsight and deep reasoning via Groq.
    """

    def __init__(self, groq_api_key: Optional[str] = None, model: str = DEFAULT_GROQ_MODEL):
        self.api_key = groq_api_key or os.environ.get("GROQ_API_KEY")
        self.model = model
        self._groq_client: Optional[Groq] = None

    def get_groq_client(self) -> Groq:
        if self._groq_client is not None:
            return self._groq_client
        if not self.api_key:
            raise ValueError("GROQ_API_KEY is required but not set in environment or constructor.")
        self._groq_client = Groq(api_key=self.api_key)
        return self._groq_client

    def _build_system_prompt(self) -> str:
        return (
            "You are an expert Incident Response AI Agent assisting an on-call site reliability engineer (SRE).\n"
            "Your objective is to analyze the active incident, evaluate any historical incident memory provided, "
            "and generate structured, ranked root-cause hypotheses and concrete investigation steps.\n\n"
            "CRITICAL REASONING RULES:\n"
            "1. EVIDENCE VS PROOF: Treat recalled historical incidents as potential evidence and pattern hints, "
            "NEVER as definitive proof. Current systems may fail in new ways despite similar symptoms.\n"
            "2. DISTINGUISH OBSERVATIONS: Clearly distinguish between current incident observations "
            "and historical precedent.\n"
            "3. ACCURATE CITATIONS: If a hypothesis or investigation step is informed by a historical incident memory, "
            "explicitly cite the Memory ID (e.g. 'ID: mem-xxx' or 'Incident INC-002') in the 'citations' array.\n"
            "4. NO HALLUCINATIONS: NEVER invent historical incidents, incident IDs, or citations not present in the provided context.\n"
            "5. NO MEMORY FALLBACK: If no historical memories are provided, or if the provided memories are not relevant, "
            "explicitly set 'memory_used': false, set 'memory_references': [], and rely on first-principles systems diagnostics.\n"
            "6. STRUCTURED JSON: You MUST respond ONLY with a valid JSON object strictly adhering to this schema:\n"
            "{\n"
            '  "summary": "Concise overview of current situation and potential impact",\n'
            '  "hypotheses": [\n'
            '    {\n'
            '      "title": "Hypothesis headline",\n'
            '      "reason": "Detailed technical explanation",\n'
            '      "confidence": "high" | "medium" | "low",\n'
            '      "citations": ["Memory ID or citation string"]\n'
            '    }\n'
            '  ],\n'
            '  "investigation_steps": [\n'
            '    {\n'
            '      "step": 1,\n'
            '      "description": "Concrete command or inspection action",\n'
            '      "reason": "Why this step is critical and what it isolates"\n'
            '    }\n'
            '  ],\n'
            '  "memory_used": true | false,\n'
            '  "memory_references": ["List of relevant memory IDs/summaries cited"]\n'
            "}"
        )

    def _build_user_prompt(self, incident: Incident, memory_context: str, memory_count: int) -> str:
        prompt_lines = [
            "=== ACTIVE INCIDENT DETAILS ===",
            f"Incident ID: {incident.id}",
            f"Title: {incident.title}",
            f"Severity: {incident.severity}",
            f"Target Service: {incident.service}",
            f"Symptoms: {incident.formatted_symptoms()}",
        ]
        if incident.error_summary:
            prompt_lines.append(f"Error Summary / Logs: {incident.error_summary}")
        if incident.recent_deployment:
            prompt_lines.append(f"Recent Deployment: {incident.recent_deployment}")
        if incident.config_changes:
            prompt_lines.append(f"Configuration Changes: {incident.config_changes}")
        if incident.affected_components:
            prompt_lines.append(f"Affected Components: {', '.join(incident.affected_components)}")

        prompt_lines.extend([
            "",
            "=== HISTORICAL INCIDENT MEMORIES (HINDSIGHT RECALL) ===",
            f"Memory Items Recalled: {memory_count}",
            memory_context,
            "",
            "Analyze the active incident and produce your JSON investigation plan."
        ])

        return "\n".join(prompt_lines)

    def analyze_incident(self, incident: Union[Incident, Dict[str, Any]]) -> IncidentAnalysisResponse:
        """
        Executes the end-to-end incident analysis lifecycle:
        1. Construct recall query from incident attributes
        2. Recall historical memories from Hindsight
        3. Format recalled memories into structured context
        4. Query Groq LLM for reasoning, hypotheses, and investigation steps
        5. Return structured, verified IncidentAnalysisResponse
        """
        # Convert dict to Incident model if necessary
        if isinstance(incident, dict):
            incident_obj = Incident(**incident)
        else:
            incident_obj = incident

        # 1. Construct Recall Query
        recall_query = build_recall_query(incident_obj)

        # 2. Hindsight Recall
        recall_res: RecallFetchResult = recall_memories(recall_query)

        # 3. Format Memories
        memory_context = format_recalled_memories(recall_res)

        # 4. Groq Reasoning
        system_prompt = self._build_system_prompt()
        user_prompt = self._build_user_prompt(incident_obj, memory_context, recall_res.memory_count)

        try:
            client = self.get_groq_client()
            completion = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            raw_content = completion.choices[0].message.content or "{}"
            parsed_data = json.loads(raw_content)

            # Ensure memory metadata reflects actual recall state
            if not recall_res.memory_available:
                parsed_data["memory_used"] = False
                parsed_data["memory_references"] = []
            else:
                # If memories were available, ensure memory_used flag is present
                parsed_data["memory_used"] = parsed_data.get("memory_used", True)

            parsed_data["memory_count"] = recall_res.memory_count
            parsed_data["memory_error"] = recall_res.memory_error
            parsed_data["recall_query"] = recall_query

            return IncidentAnalysisResponse(**parsed_data)

        except json.JSONDecodeError as jde:
            logger.warning(f"Failed to parse Groq response as JSON: {jde}")
            # Fallback graceful response
            return IncidentAnalysisResponse(
                summary=f"Incident {incident_obj.id} on service {incident_obj.service}: {incident_obj.formatted_symptoms()}",
                hypotheses=[
                    Hypothesis(
                        title="Service degradation or resource exhaustion",
                        reason=f"Observed symptoms: {incident_obj.formatted_symptoms()}",
                        confidence="medium",
                        citations=[]
                    )
                ],
                investigation_steps=[
                    InvestigationStep(
                        step=1,
                        description=f"Inspect telemetry and logs for {incident_obj.service}",
                        reason="Isolate primary failure mechanism"
                    )
                ],
                memory_used=recall_res.memory_available,
                memory_count=recall_res.memory_count,
                memory_references=[],
                memory_error=f"LLM JSON parsing error: {jde}",
                recall_query=recall_query
            )
        except Exception as e:
            logger.warning(f"Incident reasoning fallback triggered: {type(e).__name__} - {str(e)}")
            # Safe structured response when LLM or network error occurs
            return IncidentAnalysisResponse(
                summary=f"Automated analysis fallback for {incident_obj.id} ({incident_obj.service})",
                hypotheses=[
                    Hypothesis(
                        title="Potential service dependency failure or configuration mismatch",
                        reason=f"Incident symptoms '{incident_obj.formatted_symptoms()}' indicate active degradation.",
                        confidence="low",
                        citations=[]
                    )
                ],
                investigation_steps=[
                    InvestigationStep(
                        step=1,
                        description=f"Check health and connection metrics for {incident_obj.service}",
                        reason="Establish baseline service state"
                    ),
                    InvestigationStep(
                        step=2,
                        description="Review recent deployments and configuration changes",
                        reason="Identify potential breaking changes"
                    )
                ],
                memory_used=False,
                memory_count=recall_res.memory_count,
                memory_references=[],
                memory_error=f"{type(e).__name__}: {str(e)}",
                recall_query=recall_query
            )


# Module-level convenience function
def analyze_incident(incident: Union[Incident, Dict[str, Any]]) -> IncidentAnalysisResponse:
    agent = IncidentAgent()
    return agent.analyze_incident(incident)
