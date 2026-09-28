import unittest
from agent.models import Incident
from agent.query_builder import build_recall_query


class TestQueryBuilder(unittest.TestCase):

    def test_full_incident_query_construction(self):
        incident = Incident(
            id="INC-001",
            title="Database Connection Pool Exhaustion on Payments API",
            severity="SEV-1",
            service="payments-api",
            symptoms=["repeated database connection timeouts", "HTTP 504 checkout failure"],
            error_summary="ConnectionPoolTimeoutException: pool exhausted after 30000ms",
            recent_deployment="Deployed v2.14.0 enabling batch transactions",
            config_changes="DB_POOL_SIZE=10",
            affected_components=["checkout-gateway", "billing-service"]
        )

        query = build_recall_query(incident)

        self.assertIn("payments-api", query)
        self.assertIn("repeated database connection timeouts", query)
        self.assertIn("ConnectionPoolTimeoutException", query)
        self.assertIn("deployment", query)
        self.assertIn("config", query)
        self.assertIn("checkout-gateway", query)
        self.assertIn("billing-service", query)

    def test_dict_input_query_construction(self):
        raw_dict = {
            "id": "INC-002",
            "title": "High CPU utilization on auth-service",
            "service": "auth-service",
            "symptoms": "JWT validation latency spikes",
            "error_summary": "CryptoKeyRefreshError",
            "recent_deployment": "v1.2.0"
        }

        query = build_recall_query(raw_dict)
        self.assertIn("auth-service", query)
        self.assertIn("JWT validation latency spikes", query)
        self.assertIn("CryptoKeyRefreshError", query)

    def test_minimal_incident_fallback(self):
        incident = Incident(
            id="INC-003",
            title="Service glitch",
            service="order-api",
            symptoms=""
        )
        query = build_recall_query(incident)
        self.assertIn("order-api", query)


if __name__ == "__main__":
    unittest.main()
