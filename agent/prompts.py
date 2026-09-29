from typing import List, Optional
from agent.models import Incident


def get_agent_system_prompt() -> str:
    """
    Returns the core system prompt for the Incident Response Agent reasoning engine.
    """
    return (
        "You are an elite Site Reliability Engineering (SRE) Incident Response AI Agent.\n"
        "Your role is to diagnose active incidents by evaluating current telemetry observations and historical precedent.\n\n"
        "CORE OPERATING PRINCIPLES:\n"
        "1. EVIDENCE VS PROOF: Treat recalled historical incidents as pattern evidence, NEVER as definitive proof. "
        "A system can manifest identical symptoms from entirely novel failure modes.\n"
        "2. DISTINGUISH OBSERVATIONS FROM HISTORY: Explicitly differentiate between what is currently observed in this incident "
        "and what occurred in historical memory.\n"
        "3. RIGOROUS CITATIONS: When a hypothesis or investigation step is informed by recalled memory, cite the exact Memory ID "
        "(e.g., 'mem-1', 'INC-002') in the 'citations' array. NEVER invent memory IDs or cite non-existent memories.\n"
        "4. FIRST-PRINCIPLES FALLBACK: If recalled memories are absent, empty, or irrelevant, set 'memory_used': false, "
        "set 'memory_references': [], and generate hypotheses and investigation steps derived purely from first-principles systems engineering.\n"
        "5. RANKED HYPOTHESES: Provide candidate root-cause hypotheses ranked from most likely to least likely, with confidence ratings ('high', 'medium', 'low').\n"
        "6. CONCRETE INVESTIGATION STEPS: Provide prioritized, actionable diagnostic commands, metric checks, or log queries with clear justifications.\n"
        "7. STRICT JSON FORMAT: Output MUST strictly be a JSON object with this exact schema:\n"
        "{\n"
        '  "summary": "Concise technical summary of active incident and potential blast radius",\n'
        '  "hypotheses": [\n'
        '    {\n'
        '      "title": "Hypothesis headline",\n'
        '      "confidence": "high" | "medium" | "low",\n'
        '      "reasoning": "Detailed technical explanation distinguishing evidence from current state",\n'
        '      "citations": ["Exact Memory ID cited, or empty if first-principles"]\n'
        '    }\n'
        '  ],\n'
        '  "investigation_steps": [\n'
        '    {\n'
        '      "step": 1,\n'
        '      "description": "Concrete diagnostic action, query, or command",\n'
        '      "why": "Specific signal or isolation capability provided by this step",\n'
        '      "citations": ["Optional Memory ID if step is informed by past resolution"]\n'
        '    }\n'
        '  ],\n'
        '  "memory_used": true | false,\n'
        '  "memory_references": ["List of exact Memory IDs utilized in reasoning"]\n'
        "}"
    )


def build_agent_user_prompt(incident: Incident, memory_context: str, memory_count: int) -> str:
    """
    Constructs the structured user prompt combining the active incident telemetry and recalled memory context.
    """
    prompt_sections = [
        "=== ACTIVE INCIDENT DETAILS ===",
        f"Incident ID:       {incident.id}",
        f"Title:             {incident.title}",
        f"Severity:          {incident.severity}",
        f"Service:           {incident.service}",
        f"Symptoms:          {incident.formatted_symptoms()}",
    ]

    if incident.error_summary:
        prompt_sections.append(f"Error Summary:     {incident.error_summary}")
    if incident.recent_deployment:
        prompt_sections.append(f"Recent Deployment: {incident.recent_deployment}")
    if incident.config_changes:
        prompt_sections.append(f"Config Changes:    {incident.config_changes}")
    if incident.affected_components:
        prompt_sections.append(f"Affected Components: {', '.join(incident.affected_components)}")

    prompt_sections.extend([
        "",
        "=== HISTORICAL INCIDENT PRECEDENT (HINDSIGHT MEMORY) ===",
        f"Memories Recalled: {memory_count}",
        memory_context,
        "",
        "Analyze the active incident and produce your JSON diagnostic response according to the required schema."
    ])

    return "\n".join(prompt_sections)
