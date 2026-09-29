"""
Standalone evaluation harness for the Incident Response Agent.

This does NOT require the team's backend yet.
It prepares the evaluation cases and checks an agent result JSON against
the expected evidence. Later, the team can replace `agent_output` with
the real /analyze response.

Usage:
    python evaluation/run_eval.py
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCENARIO_FILE = ROOT / "data/evaluation/scenarios/evaluation_scenarios.json"


def load_scenarios():
    return json.loads(SCENARIO_FILE.read_text(encoding="utf-8"))


def evaluate_case(scenario, agent_output):
    """
    Lightweight qualitative evaluator.

    Expected agent_output shape:
    {
      "memory_ids": ["INC-001"],
      "hypotheses": ["DB connection exhaustion"],
      "recommended_steps": ["Check DB pool utilization"],
      "avoided_failed_attempts": ["Restart pods"],
      "explanation": "..."
    }
    """
    text = json.dumps(agent_output).lower()
    expected = scenario.get("expected_memory", [])

    memory_hits = sum(1 for x in expected if x.lower() in text)
    checks = scenario.get("checks", [])

    # This is deliberately a checklist rather than a fake accuracy score.
    return {
        "scenario": scenario["id"],
        "name": scenario["name"],
        "expected_memory": expected,
        "memory_hits": memory_hits,
        "memory_retrieval_ok": (not expected) or memory_hits > 0,
        "checks_to_review": checks,
        "status": "PASS" if ((not expected) or memory_hits > 0) else "REVIEW",
    }


def main():
    scenarios = load_scenarios()

    print("=" * 72)
    print("INCIDENT RESPONSE AGENT — EVALUATION HARNESS")
    print("=" * 72)
    print(f"Loaded {len(scenarios)} evaluation scenarios.")
    print()
    print("Run each scenario in two modes:")
    print("  1. WITHOUT MEMORY — Hindsight recall disabled/empty")
    print("  2. WITH MEMORY    — seeded Hindsight bank enabled")
    print()
    print("Compare: relevant citations, useful first steps, failed-attempt avoidance,")
    print("similar-but-different reasoning, and explicit no-history behavior.")
    print()

    for s in scenarios:
        print(f"[{s['id']}] {s['name']}")
        print(f"  Expected memory: {', '.join(s.get('expected_memory', [])) or 'None'}")
        for check in s.get("checks", []):
            print(f"  - {check}")
        print()

    print("No fabricated accuracy percentage is produced.")
    print("Use the qualitative before/after evidence in the demo/report.")


if __name__ == "__main__":
    main()
