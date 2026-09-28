"""End-to-end: alert -> investigation -> approval -> execution -> report."""

from fastapi.testclient import TestClient


def test_full_payment_outage_lifecycle(client: TestClient) -> None:
    alert = client.post(
        "/api/alerts",
        json={
            "title": "Payment API error rate > 40%",
            "message": "Payment API error rate > 40% for 5 minutes",
            "source": "prometheus-alertmanager",
            "severity": "CRITICAL",
            "service": "payment-api",
            "scenario_id": "payment-api-outage",
        },
    )
    assert alert.status_code == 201
    incident_id = alert.json()["data"]["incident_id"]
    assert alert.json()["data"]["status"] == "NEW"

    investigated = client.post(f"/api/incidents/{incident_id}/investigate")
    assert investigated.status_code == 200
    assert investigated.json()["data"]["status"] == "INVESTIGATING"
    assert investigated.json()["data"]["logs"]

    analyzed = client.post(f"/api/incidents/{incident_id}/analyze")
    assert analyzed.status_code == 200
    analysis = analyzed.json()["data"]["analysis"]
    assert analysis["requires_human_approval"] is True
    assert analysis["suspected_root_cause"]
    assert analyzed.json()["data"]["fallback_used"] is True

    incident = client.get(f"/api/incidents/{incident_id}").json()["data"]
    assert incident["status"] == "AWAITING_APPROVAL"
    action = incident["recommended_actions"][0]

    listed_actions = client.get(f"/api/incidents/{incident_id}/actions")
    assert listed_actions.status_code == 200
    assert listed_actions.json()["data"][0]["id"] == action["id"]

    client.post(
        f"/api/incidents/{incident_id}/actions/{action['id']}/approve",
        json={"approved_by": "judge-demo"},
    )
    executed = client.post(
        f"/api/incidents/{incident_id}/actions/{action['id']}/execute"
    )
    body = executed.json()["data"]
    assert body["status"] == "RESOLVED"
    assert body["verification_result"]["healthy"] is True

    timeline = client.get(f"/api/incidents/{incident_id}/timeline").json()["data"]
    events = {item["event"] for item in timeline}
    assert "INCIDENT_CREATED" in events
    assert "ACTION_RECOMMENDED" in events
    assert "ACTION_APPROVED" in events
    assert "ACTION_EXECUTED" in events
    assert "INCIDENT_RESOLVED" in events

    report = client.get(f"/api/incidents/{incident_id}/report").json()["data"]
    assert "disclaimer" in report
    assert report["status"] == "RESOLVED"
