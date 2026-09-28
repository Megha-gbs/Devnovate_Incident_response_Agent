# Yashwanth — Dataset + Evaluation Deliverable

## What this folder is

This is a standalone deliverable for the **Dataset + Evaluation** role of the
Incident Response Agent project. It does not depend on the team's GitHub repo.

The project plan assigns this role:
- Create 25–35 realistic historical incidents.
- Include recurring relationships between incidents.
- Create evaluation scenarios.
- Compare agent behavior with no historical memory vs Hindsight memory.
- Document whether the agent cites relevant incidents, uses successful steps,
  avoids failed approaches, and recognizes when history is not useful.

## Included

### Dataset
`data/historical/incidents/`
- 30 synthetic incidents
- JSON format
- Symptoms
- Root cause
- Failed attempts
- Successful steps
- Resolution
- Postmortem
- Tags

`data/historical/postmortems/`
- Human-readable postmortems for all 30 incidents.

### Evaluation
`data/evaluation/scenarios/evaluation_scenarios.json`
- 8 evaluation scenarios.

`evaluation/run_eval.py`
- Standalone evaluation harness.
- Does not invent accuracy percentages.
- Prints the cases and qualitative checks to perform.

### Validation / seeding preparation
`scripts/validate_dataset.py`
- Confirms incident count and required fields.

`scripts/seed_manifest.py`
- Converts historical incidents into a Hindsight-ready JSONL narrative manifest.
- The team's Hindsight integration can consume this later.

## How to run

From the project root:

```bash
python scripts/validate_dataset.py
python scripts/seed_manifest.py
python evaluation/run_eval.py
```

Expected validation:

```text
VALID: 30 incidents, 8 evaluation scenarios
```

## Evaluation method

For every scenario, run the same current incident twice:

### A. Without memory
Disable/empty Hindsight recall.

Record:
- What hypothesis did the agent produce?
- What first investigation step did it recommend?
- Did it say that useful history was unavailable?

### B. With memory
Use the seeded Hindsight bank.

Record:
- Which historical incident(s) were recalled?
- Did the agent identify the common pattern?
- Did it recommend a successful historical step?
- Did it avoid a historically failed approach?
- Did it explain why the memory was relevant?
- Did it distinguish similar incidents with different root causes?

## Important

Do **not** claim a made-up accuracy percentage. The project plan explicitly
calls for qualitative before/after evidence.

The strongest demo story is:

New incident → Hindsight recalls related incidents → agent cites them →
agent recommends successful investigation steps and avoids failed approaches →
incident is resolved → postmortem is retained → future incident recalls the
new knowledge.
