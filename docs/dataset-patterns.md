# Dataset Pattern Map

| Pattern | Incidents |
|---|---|
| DB connection exhaustion | INC-001, INC-002, INC-003, INC-004 |
| Config / feature flags / secrets | INC-005, INC-006, INC-007, INC-008, INC-024, INC-027, INC-030 |
| Dependency timeout / third-party outage | INC-009, INC-010, INC-011, INC-025 |
| CPU / memory / resource exhaustion | INC-012, INC-013, INC-014, INC-023 |
| DNS / network | INC-015, INC-016, INC-029 |
| Auth / TLS / certificate | INC-017, INC-018, INC-019 |
| Database / deployment / Kubernetes | INC-020, INC-021, INC-026, INC-028 |
| Cache failure | INC-022 |
| Unique/other operational patterns | INC-027, INC-030 |

The relationships are intentional: several incidents share symptoms but differ in root cause,
so evaluation can test whether the agent retrieves useful memories without blindly copying them.
