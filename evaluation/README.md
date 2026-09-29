# Dataset & Evaluation — Incident Response Agent

## Purpose
This package supports the MVP requirement to demonstrate that Hindsight memory helps the incident agent use prior organizational knowledge.

## Dataset
- 30 synthetic but realistic incidents
- 8 services
- Recurring patterns: DB connection exhaustion, configuration/feature flags, dependency timeouts, CPU/memory exhaustion, DNS/network, auth/TLS, and unique incidents
- Each incident includes symptoms, root cause, failed attempts, successful steps, resolution, postmortem, and tags.

## Evaluation
8 scenarios cover:
1. Relevant retrieval
2. Similar symptoms with different root cause
3. Avoiding failed approaches
4. Irrelevant memory filtering
5. Pattern recognition
6. Learning after retention
7. Brand-new pattern
8. Configuration troubleshooting

## Suggested evaluation method
Run each scenario twice:
- **No-memory:** empty Hindsight bank or retrieval disabled.
- **With-memory:** seeded Hindsight bank.

Record:
- Relevant incident citation accuracy
- Whether the first investigation step is supported by prior success
- Whether failed historical attempts are avoided
- Whether similar-but-different incidents are distinguished
- Whether the agent explicitly says when useful history is absent

Do not invent accuracy percentages. Use qualitative before/after examples as specified by the project plan.
