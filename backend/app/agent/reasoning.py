import os
import json
import logging
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv
from groq import Groq

from agent.models import Incident, IncidentAnalysis, Hypothesis, InvestigationStep
from agent.prompts import get_agent_system_prompt, build_agent_user_prompt
from agent.exceptions import (
    AgentReasoningError,
    GroqAuthenticationError,
    GroqServiceUnavailableError,
)

load_dotenv()
logger = logging.getLogger(__name__)

DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"


def sanitize_citations(raw_citations: List[str], valid_memory_ids: List[str]) -> List[str]:
    """
    Enforces citation integrity: filters out hallucinated citations that were not in recalled memory IDs.
    """
    if not valid_memory_ids:
        return []
    valid_set = {str(mid).strip().lower() for mid in valid_memory_ids if mid}
    verified = []
    for cit in raw_citations:
        cit_str = str(cit).strip()
        # Check if citation matches any valid memory ID
        if any(v in cit_str.lower() for v in valid_set):
            verified.append(cit_str)
    return verified


def execute_reasoning(
    incident: Incident,
    memory_context: str,
    memory_count: int,
    recalled_memory_ids: List[str],
    groq_client: Optional[Groq] = None,
    model: str = DEFAULT_GROQ_MODEL,
    recall_query: Optional[str] = None,
    memory_error: Optional[str] = None
) -> IncidentAnalysis:
    """
    Executes deep incident reasoning using Groq LLM with structured output parsing and citation verification.
    """
    system_prompt = get_agent_system_prompt()
    user_prompt = build_agent_user_prompt(incident, memory_context, memory_count)

    # Initialize Groq client if not provided
    client = groq_client
    if client is None:
        groq_key = os.environ.get("GROQ_API_KEY")
        if not groq_key:
            logger.warning("GROQ_API_KEY is not set. Generating deterministic memory-informed analysis.")
            return generate_fallback_analysis(
                incident=incident,
                memory_count=memory_count,
                recall_query=recall_query,
                reason="GROQ_API_KEY environment variable is not configured.",
                memory_error=memory_error,
                recalled_memory_ids=recalled_memory_ids,
            )
        try:
            client = Groq(api_key=groq_key)
        except Exception as e:
            logger.warning(f"Failed to initialize Groq client: {e}")
            return generate_fallback_analysis(
                incident=incident,
                memory_count=memory_count,
                recall_query=recall_query,
                reason=f"Groq initialization error: {e}",
                memory_error=memory_error,
                recalled_memory_ids=recalled_memory_ids,
            )

    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        raw_text = completion.choices[0].message.content or "{}"
        parsed = json.loads(raw_text)

        # Enforce memory integrity
        if memory_count == 0 or not recalled_memory_ids:
            parsed["memory_used"] = False
            parsed["memory_references"] = []
        else:
            parsed["memory_used"] = parsed.get("memory_used", True)
            raw_refs = parsed.get("memory_references", [])
            parsed["memory_references"] = sanitize_citations(raw_refs, recalled_memory_ids) or recalled_memory_ids[:5]

        # Clean citations on each hypothesis and investigation step
        cleaned_hypotheses = []
        for h in parsed.get("hypotheses", []):
            if isinstance(h, dict):
                raw_cits = h.get("citations", [])
                h["citations"] = sanitize_citations(raw_cits, recalled_memory_ids)
                cleaned_hypotheses.append(Hypothesis(**h))

        cleaned_steps = []
        for s in parsed.get("investigation_steps", []):
            if isinstance(s, dict):
                raw_cits = s.get("citations", [])
                s["citations"] = sanitize_citations(raw_cits, recalled_memory_ids)
                cleaned_steps.append(InvestigationStep(**s))

        return IncidentAnalysis(
            summary=parsed.get("summary", f"Incident analysis for {incident.id}"),
            hypotheses=cleaned_hypotheses,
            investigation_steps=cleaned_steps,
            memory_used=parsed["memory_used"],
            memory_count=memory_count,
            memory_references=parsed["memory_references"],
            memory_error=memory_error,
            recall_query=recall_query
        )

    except json.JSONDecodeError as jde:
        logger.warning(f"Failed to parse Groq response JSON: {jde}")
        return generate_fallback_analysis(
            incident=incident,
            memory_count=memory_count,
            recall_query=recall_query,
            reason=f"LLM JSON parsing error: {jde}",
            memory_error=memory_error,
            recalled_memory_ids=recalled_memory_ids,
        )
    except Exception as e:
        logger.warning(f"Groq reasoning execution fallback: {type(e).__name__} - {str(e)}")
        return generate_fallback_analysis(
            incident=incident,
            memory_count=memory_count,
            recall_query=recall_query,
            reason=f"{type(e).__name__}: {str(e)}",
            memory_error=memory_error,
            recalled_memory_ids=recalled_memory_ids,
        )


def generate_fallback_analysis(
    incident: Incident,
    memory_count: int,
    recall_query: Optional[str],
    reason: str,
    memory_error: Optional[str] = None,
    recalled_memory_ids: Optional[List[str]] = None,
) -> IncidentAnalysis:
    """
    Generates a deterministic diagnostic analysis report informed by recalled historical memories.
    """
    mem_refs = [mid for mid in (recalled_memory_ids or []) if mid]
    has_mem = bool(mem_refs and memory_count > 0)
    top_mem = mem_refs[0] if mem_refs else None

    hypotheses = []
    if has_mem and top_mem:
        hypotheses.append(
            Hypothesis(
                title=f"Service capacity exhaustion or dependency latency ({top_mem} precedent)",
                confidence="high" if len(mem_refs) >= 2 else "medium",
                reasoning=(
                    f"Observed symptoms: '{incident.formatted_symptoms()}'. "
                    f"Correlates with historical precedent in {', '.join(mem_refs[:2])}. "
                    f"Recent change '{incident.recent_deployment or 'None reported'}' should be verified."
                ),
                citations=mem_refs[:2]
            )
        )
        if len(mem_refs) > 1:
            hypotheses.append(
                Hypothesis(
                    title=f"Resource leak regression ({mem_refs[1]} precedent)",
                    confidence="medium",
                    reasoning=(
                        f"Secondary pattern matched in {mem_refs[1]}: gradual resource starvation or timeout cascade. "
                        "Verify connection release and downstream latency metrics."
                    ),
                    citations=[mem_refs[1]]
                )
            )
    else:
        hypotheses.append(
            Hypothesis(
                title="Service capacity exhaustion or dependency latency",
                confidence="low",
                reasoning=(
                    f"Observed symptoms: '{incident.formatted_symptoms()}'. "
                    f"Recent change '{incident.recent_deployment or 'N/A'}' may have altered resource demand. "
                    "(Derived via first-principles diagnostics)"
                ),
                citations=[]
            )
        )

    investigation_steps = [
        InvestigationStep(
            step=1,
            description=f"Check active connection counts and thread pool saturation on {incident.service}",
            why=f"Isolate resource starvation (informed by {top_mem})" if top_mem else "Determine whether service is experiencing resource starvation",
            citations=[top_mem] if top_mem else []
        ),
        InvestigationStep(
            step=2,
            description=f"Inspect upstream dependencies and database error logs for {incident.service}",
            why="Identify downstream bottlenecks or timeout triggers, avoiding repetitive blind restarts",
            citations=mem_refs[:2] if mem_refs else []
        ),
        InvestigationStep(
            step=3,
            description="Review recent deployment diffs and configuration changes",
            why="Verify whether recent changes introduced regressions or resource leaks",
            citations=[]
        )
    ]

    effective_error = memory_error or reason

    return IncidentAnalysis(
        summary=(
            f"Diagnostic assessment for {incident.id} on '{incident.service}'. "
            + (f"Correlated with {len(mem_refs)} historical organizational memories ({', '.join(mem_refs[:3])})." if has_mem else "First-principles baseline diagnostics.")
        ),
        hypotheses=hypotheses,
        investigation_steps=investigation_steps,
        memory_used=has_mem,
        memory_count=memory_count,
        memory_references=mem_refs[:5],
        memory_error=effective_error,
        recall_query=recall_query
    )
