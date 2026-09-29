"""
Incident Response Agent - End-to-End Demo Scenario

Demonstrates the complete lifecycle:
1. Active Incident (INC-DEMO-001)
2. Semantic Recall Query Construction
3. Hindsight Memory Recall
4. Memory Formatting & Context Preparation
5. Groq LLM Reasoning (model: openai/gpt-oss-120b)
6. Ranked Hypotheses with Verified Citations
7. Concrete Actionable Investigation Steps
8. Incident Resolution & Approved Post-Mortem Synthesis
9. Sanitized Post-Mortem Retention in Hindsight Bank
10. Future Incident Benefit Demonstration
"""

import sys
from agent.models import Incident, ResolvedIncident, IncidentAnalysis
from agent.service import analyze_incident, retain_approved_postmortem
from agent.query_builder import build_recall_query
from hindsight.memory import recall_memories
from hindsight.formatter import format_memory_context
from hindsight.client import close_hindsight_client


def run_demo():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    print("=" * 80)
    print("      INCIDENT RESPONSE AGENT - INTELLIGENCE & MEMORY DEMO")
    print("=" * 80)

    try:
        # -------------------------------------------------------------------------
        # STEP 1: DEFINE ACTIVE INCIDENT
        # -------------------------------------------------------------------------
        incident_1 = Incident(
            id="INC-DEMO-001",
            title="Repeated Database Connection Timeouts on Payments API",
            severity="SEV-1",
            service="payments-api",
            symptoms=[
                "repeated database connection timeouts",
                "HTTP 504 Gateway Timeouts on /checkout endpoints"
            ],
            error_summary="ConnectionPoolTimeoutException: Timeout waiting for idle connection from pool after 30000ms",
            recent_deployment="Deployed release v2.14.0 enabling higher concurrency worker threads",
            config_changes="DB_POOL_SIZE=10 (unchanged)",
            affected_components=["checkout-gateway", "billing-service"]
        )

        print("\n[1] ACTIVE INCIDENT RECEIVED:")
        print(f"    - Incident ID:       {incident_1.id}")
        print(f"    - Title:             {incident_1.title}")
        print(f"    - Service:           {incident_1.service}")
        print(f"    - Severity:          {incident_1.severity}")
        print(f"    - Symptoms:          {incident_1.formatted_symptoms()}")
        print(f"    - Error Summary:     {incident_1.error_summary}")
        print(f"    - Recent Change:     {incident_1.recent_deployment}")
        print(f"    - Config:            {incident_1.config_changes}")
        print(f"    - Components:        {', '.join(incident_1.affected_components)}")

        # -------------------------------------------------------------------------
        # STEP 2: BUILD RECALL QUERY
        # -------------------------------------------------------------------------
        query = build_recall_query(incident_1)
        print(f"\n[2] CONSTRUCTED HINDSIGHT RECALL QUERY:\n    \"{query}\"")

        # -------------------------------------------------------------------------
        # STEP 3 & 4: HINDSIGHT RECALL & FORMATTING
        # -------------------------------------------------------------------------
        print("\n[3] QUERYING HINDSIGHT MEMORY BANK...")
        recall_res = recall_memories(query)
        print(f"    - Memory Available:  {recall_res.memory_available}")
        print(f"    - Memories Recalled: {recall_res.memory_count}")
        if recall_res.memory_error:
            print(f"    - Memory Note:       {recall_res.memory_error}")

        formatted_mem = format_memory_context(recall_res)
        print(f"\n[4] FORMATTED MEMORY CONTEXT FOR LLM:\n{formatted_mem.strip()}")

        # -------------------------------------------------------------------------
        # STEP 5, 6, 7: GROQ REASONING & STRUCTURED OUTPUT
        # -------------------------------------------------------------------------
        print("\n[5] RUNNING GROQ REASONING (model: openai/gpt-oss-120b)...")
        analysis: IncidentAnalysis = analyze_incident(incident_1)

        print("\n" + "=" * 80)
        print("                    INCIDENT ANALYSIS REPORT")
        print("=" * 80)
        print(f"\nSUMMARY:\n{analysis.summary}\n")

        print(f"MEMORY UTILIZATION: Used={analysis.memory_used} | Count={analysis.memory_count}")
        if analysis.memory_references:
            print(f"MEMORY REFERENCES: {', '.join(analysis.memory_references)}")

        print("\nRANKED ROOT-CAUSE HYPOTHESES:")
        for idx, hyp in enumerate(analysis.hypotheses, 1):
            print(f"\n  Hypothesis #{idx}: {hyp.title}")
            print(f"  Confidence:   [{hyp.confidence.upper()}]")
            print(f"  Reasoning:    {hyp.reasoning}")
            if hyp.citations:
                print(f"  Citations:    {', '.join(hyp.citations)}")
            else:
                print("  Citations:    None (first-principles reasoning)")

        print("\nACTIONABLE INVESTIGATION STEPS:")
        for step in analysis.investigation_steps:
            print(f"\n  Step {step.step}: {step.description}")
            print(f"  Why:    {step.why}")
            if step.citations:
                print(f"  Citations: {', '.join(step.citations)}")

        # -------------------------------------------------------------------------
        # STEP 8 & 9: INCIDENT RESOLUTION & POST-MORTEM RETENTION
        # -------------------------------------------------------------------------
        print("\n" + "=" * 80)
        print("        INCIDENT RESOLVED - POST-MORTEM KNOWLEDGE RETENTION")
        print("=" * 80)

        resolved_incident = ResolvedIncident(
            incident_id=incident_1.id,
            title=incident_1.title,
            service=incident_1.service,
            symptoms=incident_1.symptoms,
            recent_change=incident_1.recent_deployment,
            root_cause="Database connection pool size of 10 was insufficient for increased worker concurrency in v2.14.0.",
            failed_attempts=[
                "Service restart was attempted but failed as all workers immediately exhausted the pool again."
            ],
            successful_resolution="Increased DB_POOL_SIZE from 10 to 50 and adjusted PostgreSQL max_connections to 200.",
            lessons_learned=[
                "Add alert when connection pool utilization exceeds 80%",
                "Require database connection sizing review for all concurrency changes"
            ],
            post_mortem="Full mitigation completed within 15 minutes of pool resize."
        )

        print(f"\nRetaining approved post-mortem for {resolved_incident.incident_id} in Hindsight...")
        retention_result = retain_approved_postmortem(incident=incident_1, postmortem=resolved_incident)
        print(f"Retention Status: Success={retention_result.get('success')}")
        if retention_result.get("error"):
            print(f"Retention Note:   {retention_result.get('error')}")
        else:
            print(f"Retention Message: {retention_result.get('message')}")

        # -------------------------------------------------------------------------
        # STEP 10: FUTURE INCIDENT BENEFIT DEMO
        # -------------------------------------------------------------------------
        print("\n" + "=" * 80)
        print("          FUTURE INCIDENT BENEFIT DEMONSTRATION")
        print("=" * 80)
        print("\nScenario: A new incident occurs weeks later on payments-api:")
        incident_future = Incident(
            id="INC-FUTURE-099",
            title="High latency and DB connection timeouts during Black Friday traffic surge",
            severity="SEV-1",
            service="payments-api",
            symptoms=["database connection timeouts", "slow query responses"],
            recent_deployment="No recent deployment - high organic traffic surge",
            config_changes="None"
        )
        future_query = build_recall_query(incident_future)
        print(f"Future Incident Query: \"{future_query}\"")
        print("Future incidents will automatically retrieve the verified pool exhaustion root-cause")
        print("and avoid repeating the failed restart attempt, immediately guiding the on-call engineer")
        print("to inspect and scale the connection pool.")

        print("\n" + "=" * 80)
        print("DEMO COMPLETED SUCCESSFULLY")
        print("=" * 80)

    finally:
        # Cleanly release Hindsight HTTP sessions to avoid unclosed connector warnings
        close_hindsight_client()


if __name__ == "__main__":
    run_demo()
