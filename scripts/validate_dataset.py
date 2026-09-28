import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
files = sorted((ROOT/"data/historical/incidents").glob("*.json"))
assert 25 <= len(files) <= 35, f"Expected 25-35 incidents, found {len(files)}"

required = {"incident_id","incident","service","severity","symptoms","root_cause",
            "failed_attempts","successful_steps","resolution","postmortem","tags"}

for path in files:
    data = json.loads(path.read_text())
    missing = required - data.keys()
    assert not missing, f"{path}: missing {missing}"
    assert len(data["failed_attempts"]) >= 2
    assert len(data["successful_steps"]) >= 2
    assert len(data["symptoms"]) >= 2

scenarios = json.loads((ROOT/"data/evaluation/scenarios/evaluation_scenarios.json").read_text())
assert 7 <= len(scenarios) <= 10
print(f"VALID: {len(files)} incidents, {len(scenarios)} evaluation scenarios")
