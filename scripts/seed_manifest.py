"""Build a normalized JSONL manifest for the Hindsight seeding script.

The actual Hindsight client call is intentionally kept in the team's existing
Hindsight integration module. This script only prepares high-value narrative
memory documents and avoids retaining raw logs/secrets.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/"data/historical/hindsight_seed.jsonl"

with OUT.open("w") as out:
    for path in sorted((ROOT/"data/historical/incidents").glob("*.json")):
        x = json.loads(path.read_text())
        content = f"""Incident {x['incident_id']}: {x['incident']}
Service: {x['service']}
Severity: {x['severity']}
Symptoms: {'; '.join(x['symptoms'])}
Root cause: {x['root_cause']}
Failed troubleshooting attempts: {'; '.join(x['failed_attempts'])}
Successful resolution steps: {'; '.join(x['successful_steps'])}
Resolution: {x['resolution']}
Postmortem: {x['postmortem']}
Tags: {', '.join(x['tags'])}
"""
        out.write(json.dumps({
            "incident_id": x["incident_id"],
            "content": content,
            "context": {"service": x["service"], "severity": x["severity"], "tags": x["tags"]}
        }) + "\n")

print(f"Wrote {OUT}")
