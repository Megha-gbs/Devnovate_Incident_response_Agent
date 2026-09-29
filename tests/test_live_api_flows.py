import urllib.request
import json

def test_api_flows():
    print("=== 1. TESTING CREATE INCIDENT ===")
    create_payload = {
        "title": "Cassandra write timeout on orders keyspace",
        "service": "order-service",
        "affected_service": "order-service",
        "severity": "P1",
        "symptoms": "Clients observing WriteTimeoutException on /v2/orders endpoint",
        "description": "Clients observing WriteTimeoutException on /v2/orders endpoint",
        "logs": "[2026-09-29T22:30:00Z] ERROR order-svc: com.datastax.oss.driver.api.core.servererrors.WriteTimeoutException",
        "timestamp": "2026-09-29T22:30:00Z"
    }
    data = json.dumps(create_payload).encode()
    req = urllib.request.Request("http://127.0.0.1:8000/api/v1/incidents", data=data, headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    assert res.status == 201, f"Expected 201, got {res.status}"
    created = json.loads(res.read().decode())["data"]
    created_id = created["id"]
    print(f"Created incident: {created_id} (status: {res.status})")
    print(f"Title: {created['title']}")
    print(f"Service: {created['service']}")
    print(f"Status: {created['status']}")

    print("\n=== 2. VERIFYING INCIDENT IN LIST ===")
    req_list = urllib.request.Request("http://127.0.0.1:8000/api/v1/incidents")
    res_list = urllib.request.urlopen(req_list)
    assert res_list.status == 200
    list_data = json.loads(res_list.read().decode())["data"]
    found = any(i["id"] == created_id or i.get("incident_id") == created_id for i in list_data)
    print(f"Incident {created_id} in list: {found}")
    assert found, "Created incident not in list"

    print("\n=== 3. TESTING RESOLVE INCIDENT ON INC-023 ===")
    resolve_payload = {
        "root_cause": "Database connection pool exhaustion",
        "rootCause": "Database connection pool exhaustion",
        "resolution": "Increased database connection pool and restored service.",
        "remediation": "Increased database connection pool and restored service.",
        "summary": "Root Cause: Database connection pool exhaustion\n\nResolution: Increased database connection pool and restored service.",
        "resolved_by": "SRE On-Call (Lead)",
        "resolvedBy": "SRE On-Call (Lead)"
    }
    data = json.dumps(resolve_payload).encode()
    req_res = urllib.request.Request("http://127.0.0.1:8000/api/v1/incidents/INC-023/resolve", data=data, headers={"Content-Type": "application/json"})
    res_resolve = urllib.request.urlopen(req_res)
    assert res_resolve.status == 200, f"Expected 200, got {res_resolve.status}"
    resolved = json.loads(res_resolve.read().decode())["data"]
    print(f"Resolve status HTTP: {res_resolve.status}")
    print(f"Incident ID: {resolved['id']}")
    print(f"Status: {resolved['status']}")
    print(f"Suspected root cause: {resolved.get('suspected_root_cause')}")
    print(f"Resolution summary: {resolved.get('resolution_summary')}")
    print(f"Resolved by: {resolved.get('resolved_by')}")
    print(f"Resolution object: {resolved.get('resolution')}")
    assert resolved["status"] == "RESOLVED"
    assert resolved.get("suspected_root_cause") == "Database connection pool exhaustion"
    assert resolved.get("resolved_by") == "SRE On-Call (Lead)"
    print("\nALL API FLOW TESTS PASSED!")

if __name__ == "__main__":
    test_api_flows()
