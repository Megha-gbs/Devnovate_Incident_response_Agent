"""Incident API tests."""

from fastapi.testclient import TestClient


def test_create_and_get_incident(client: TestClient) -> None:
    created = client.post(
        "/api/incidents",
        json={
            "title": "Payment API outage",
            "description": "Checkout failing",
            "severity": "HIGH",
            "affected_service": "payment-api",
        },
    )
    assert created.status_code == 201
    body = created.json()
    assert body["success"] is True
    incident_id = body["data"]["incident_id"]
    assert incident_id.startswith("INC-")
    assert body["data"]["status"] == "NEW"

    fetched = client.get(f"/api/incidents/{incident_id}")
    assert fetched.status_code == 200
    assert fetched.json()["data"]["title"] == "Payment API outage"


def test_list_incidents(client: TestClient) -> None:
    client.post("/api/incidents", json={"title": "One incident here"})
    listed = client.get("/api/incidents")
    assert listed.status_code == 200
    assert len(listed.json()["data"]) >= 1


def test_create_validation_error(client: TestClient) -> None:
    response = client.post("/api/incidents", json={"title": "ab"})
    assert response.status_code == 422


def test_unknown_incident_404(client: TestClient) -> None:
    response = client.get("/api/incidents/INC-NOPE")
    assert response.status_code == 404
    assert response.json()["success"] is False


def test_illegal_status_transition(client: TestClient) -> None:
    created = client.post("/api/incidents", json={"title": "Need a valid title"})
    incident_id = created.json()["data"]["incident_id"]
    patched = client.patch(
        f"/api/incidents/{incident_id}",
        json={"status": "RESOLVED"},
    )
    assert patched.status_code == 409


def test_health(client: TestClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "ok"
    assert response.json()["data"]["groq_configured"] is False
