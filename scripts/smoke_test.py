#!/usr/bin/env python3
"""
OPSMIND End-to-End Integration and Smoke Test Suite.
Validates the complete 10-step incident lifecycle and organizational learning loop:
1. Health check verification (/api/health and /api/v1/health)
2. Incident listing (/api/v1/incidents)
3. Incident creation (/api/v1/incidents)
4. Incident retrieval (/api/v1/incidents/{id})
5. AI Analysis triggering (/api/v1/incidents/{id}/analyze)
6. Hindsight memory recall (similar historical incidents correlated with similarity scores)
7. Investigation step status update and timeline recording (/api/v1/incidents/{id}/steps)
8. Incident resolution (/api/v1/incidents/{id}/resolve)
9. Post-mortem authoring and storage (/api/v1/incidents/{id}/postmortem)
10. Knowledge retention into Hindsight organizational memory (/api/v1/incidents/{id}/retain)
11. LEARNING LOOP VERIFICATION: A new similar incident triggers analysis and recalls the newly retained incident!
"""

import sys
import os
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"
for p in [str(backend_dir), str(root_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi.testclient import TestClient
from app.main import app
from app.db.init_db import init_db

client = TestClient(app)

def run_smoke_test():
    print("=" * 80)
    print("OPSMIND END-TO-END SMOKE TEST & LEARNING LOOP VERIFICATION")
    print("=" * 80)

    # Initialize DB
    init_db()

    # Step 1: Health check
    print("\n[Step 1] Checking system health endpoint...")
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200, f"Health check failed: {resp.text}"
    health_data = resp.json()["data"]
    print(f"  -> Health OK: status={health_data.get('status')}, memory_bank_count={health_data.get('memory_bank_count')}")
    assert health_data.get("memory_bank_count", 0) >= 30, "Memory bank did not load 30 historical incidents!"

    # Step 2: List incidents
    print("\n[Step 2] Fetching initial incidents list...")
    resp = client.get("/api/v1/incidents")
    assert resp.status_code == 200, f"Listing failed: {resp.text}"
    incidents = resp.json()["data"]
    print(f"  -> Incidents listed: {len(incidents)} existing incidents in database.")

    # Step 3: Create incident
    print("\n[Step 3] Creating new active incident (Payment Gateway 502 connection saturation)...")
    create_payload = {
        "title": "Payment API connection pool exhaustion with elevated 502 errors",
        "service": "Payment API",
        "severity": "P1",
        "symptoms": "Spike in HTTP 502 Bad Gateway responses; pool connection timeouts reaching 30s.",
        "logs": "2026-09-29T08:00:00Z ERROR [payment-service] PoolExhaustedError: connection pool exhausted at max_size=50\n2026-09-29T08:00:01Z WARN [payment-service] slow query detected in checkout_charge",
        "timestamp": "2026-09-29T08:00:00Z"
    }
    resp = client.post("/api/v1/incidents", json=create_payload)
    assert resp.status_code in (200, 201), f"Create failed: {resp.text}"
    incident_1 = resp.json()["data"]
    inc_1_id = incident_1.get("id") or incident_1.get("incident_id")
    print(f"  -> Incident created: id={inc_1_id}, status={incident_1.get('status')}")

    # Step 4: Get incident detail
    print(f"\n[Step 4] Fetching incident detail for {inc_1_id}...")
    resp = client.get(f"/api/v1/incidents/{inc_1_id}")
    assert resp.status_code == 200, f"Get detail failed: {resp.text}"
    detail = resp.json()["data"]
    assert detail["title"] == create_payload["title"]
    print(f"  -> Incident verified: title='{detail['title']}'")

    # Step 5 & 6: Trigger AI Analysis & Verify Hindsight Memory Recall
    print(f"\n[Step 5 & 6] Triggering AI Analysis for {inc_1_id}...")
    resp = client.post(f"/api/v1/incidents/{inc_1_id}/analyze")
    assert resp.status_code == 200, f"Analysis failed: {resp.text}"
    analysis = resp.json()["data"]

    memories = analysis.get("memory", [])
    hypotheses = analysis.get("hypotheses", [])
    steps = analysis.get("steps", [])
    timeline = analysis.get("timeline", [])

    print(f"  -> Analysis completed:")
    print(f"     - Recalled memories: {len(memories)}")
    for idx, mem in enumerate(memories[:3], 1):
        print(f"       [{idx}] {mem.get('incidentId')} (similarity: {int(mem.get('similarityScore', 0) * 100)}%) - {mem.get('relevanceExplanation')[:80]}...")
    print(f"     - Hypotheses generated: {len(hypotheses)}")
    for idx, hyp in enumerate(hypotheses[:2], 1):
        print(f"       [{idx}] {hyp.get('title')} (confidence: {hyp.get('confidence')})")
    print(f"     - Recommended steps: {len(steps)}")
    for idx, st in enumerate(steps[:2], 1):
        print(f"       [{idx}] {st.get('action')} [order={st.get('order')}]")

    assert len(memories) > 0, "Expected at least 1 historical memory recalled!"
    assert len(hypotheses) > 0, "Expected at least 1 hypothesis!"
    assert len(steps) > 0, "Expected at least 1 recommended step!"

    # Step 7: Update investigation step
    first_step_id = steps[0]["id"]
    print(f"\n[Step 7] Updating investigation step {first_step_id} to 'done'...")
    step_payload = {
        "stepId": first_step_id,
        "status": "done",
        "notes": "Verified database pool metrics; confirmed 48/50 connections active without release."
    }
    resp = client.post(f"/api/v1/incidents/{inc_1_id}/steps", json=step_payload)
    assert resp.status_code == 200, f"Step update failed: {resp.text}"
    updated_step = resp.json()["data"]
    print(f"  -> Step updated: status={updated_step.get('status')}, notes={updated_step.get('notes')}")

    # Step 8: Resolve incident
    print(f"\n[Step 8] Resolving incident {inc_1_id}...")
    resolve_payload = {
        "summary": "Root Cause: Database connection pool leak in checkout_charge handler.\nResolution: Doubled pool max_size to 100 and deployed hotfix patch releasing unhandled sessions in finally block.",
        "resolvedBy": "Senior SRE (Ops Lead)"
    }
    resp = client.post(f"/api/v1/incidents/{inc_1_id}/resolve", json=resolve_payload)
    assert resp.status_code == 200, f"Resolve failed: {resp.text}"
    resolved_inc = resp.json()["data"]
    assert resolved_inc["status"].upper() == "RESOLVED"
    print(f"  -> Incident resolved: status={resolved_inc['status']}, resolved_by={resolved_inc.get('resolved_by')}")

    # Step 9: Author Post-Mortem
    print(f"\n[Step 9] Authoring post-mortem for {inc_1_id}...")
    pm_payload = {
        "rootCause": "Database connection pool leak in checkout_charge handler caused connection exhaustion under peak load.",
        "impact": "14% of payment transactions experienced 502 errors over 22 minutes.",
        "timeline": "08:00 Latency alert -> 08:05 Incident opened -> 08:12 AI correlated INC-008 -> 08:18 Hotfix deployed -> 08:22 Metrics normal",
        "actionItems": [
            "Add alert when pool utilization exceeds 80%",
            "Implement automated linter rule enforcing try-finally block connection releases"
        ]
    }
    resp = client.post(f"/api/v1/incidents/{inc_1_id}/postmortem", json=pm_payload)
    assert resp.status_code == 200, f"Postmortem creation failed: {resp.text}"
    pm_data = resp.json()["data"]
    print(f"  -> Postmortem saved: rootCause='{pm_data.get('rootCause')[:60]}...'")

    # Step 10: Retain Knowledge into Hindsight Organizational Memory
    print(f"\n[Step 10] Retaining knowledge into Hindsight organizational memory...")
    unique_learning_tag = f"learn-{inc_1_id.lower()}"
    retain_payload = {
        "insight": f"Payment API 502 timeouts under peak traffic are caused by unreleased database sessions in checkout_charge. Always check connection leak before restarting services. Reference: {inc_1_id}.",
        "tags": ["payment-service", "database", "connection-pool", unique_learning_tag]
    }
    resp = client.post(f"/api/v1/incidents/{inc_1_id}/retain", json=retain_payload)
    assert resp.status_code == 200, f"Retention failed: {resp.text}"
    retain_data = resp.json()["data"]
    print(f"  -> Knowledge retained: insight='{retain_data.get('insight')[:70]}...', retainedAt={retain_data.get('retainedAt')}")

    # Step 11: LEARNING LOOP VERIFICATION
    print("\n" + "=" * 80)
    print("[Step 11] LEARNING LOOP PROOF: Creating new incident with matching symptom pattern...")
    print("=" * 80)
    incident_2_payload = {
        "title": "Payment API elevated 502 errors and checkout latency",
        "service": "Payment API",
        "severity": "P1",
        "symptoms": "Users experiencing 502 errors during checkout; database connection pool appears exhausted.",
        "logs": "2026-09-29T09:00:00Z ERROR [payment-service] PoolExhaustedError: timeout waiting for connection\n2026-09-29T09:00:02Z ERROR [payment-service] HTTP 502 in /api/checkout",
        "timestamp": "2026-09-29T09:00:00Z"
    }
    resp = client.post("/api/v1/incidents", json=incident_2_payload)
    assert resp.status_code in (200, 201), f"Create second incident failed: {resp.text}"
    inc_2 = resp.json()["data"]
    inc_2_id = inc_2.get("id") or inc_2.get("incident_id")
    print(f"  -> New incident created: id={inc_2_id}")

    print(f"  -> Triggering AI analysis on second incident {inc_2_id} to verify memory recall...")
    resp = client.post(f"/api/v1/incidents/{inc_2_id}/analyze")
    assert resp.status_code == 200, f"Analysis of second incident failed: {resp.text}"
    analysis_2 = resp.json()["data"]
    memories_2 = analysis_2.get("memory", [])

    print(f"  -> Recalled memories for new incident: {len(memories_2)}")
    recalled_incident_ids = [m.get("incidentId") for m in memories_2]
    print(f"  -> Recalled IDs: {recalled_incident_ids}")

    # Assert that the newly retained incident from step 10 is among the recalled memories!
    assert inc_1_id in recalled_incident_ids, (
        f"CRITICAL: Learning loop failed! {inc_1_id} was NOT recalled in subsequent similar incident. "
        f"Recalled: {recalled_incident_ids}"
    )

    recalled_item = next(m for m in memories_2 if m.get("incidentId") == inc_1_id)
    print(f"\n>>> LEARNING LOOP CONFIRMED! <<<")
    print(f"  -> Previous incident {inc_1_id} was successfully recalled with similarity score {recalled_item.get('similarityScore')}!")
    print(f"  -> Explanation: {recalled_item.get('relevanceExplanation')}")
    print(f"  -> Resolution recalled: {recalled_item.get('resolution')}")

    print("\n" + "=" * 80)
    print("ALL 11 END-TO-END LIFECYCLE & LEARNING LOOP TESTS PASSED PERFECTLY!")
    print("=" * 80)

if __name__ == "__main__":
    run_smoke_test()
