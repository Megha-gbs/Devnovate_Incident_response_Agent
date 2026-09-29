import os
import unittest
from dotenv import load_dotenv

from agent.models import Incident, ResolvedIncident
from agent.agent import IncidentAgent
from agent.postmortem import retain_resolved_incident
from hindsight.memory import recall_memories, retain_memory

load_dotenv()


class TestLiveIntegration(unittest.TestCase):
    """
    Live Integration Tests for Hindsight and Groq.
    These tests only run if HINDSIGHT_API_KEY and GROQ_API_KEY are configured.
    """

    @classmethod
    def setUpClass(cls):
        cls.groq_key = os.environ.get("GROQ_API_KEY")
        cls.hindsight_key = os.environ.get("HINDSIGHT_API_KEY")

    def test_live_groq_reasoning(self):
        if not self.groq_key:
            self.skipTest("GROQ_API_KEY not configured. Skipping live Groq test.")

        agent = IncidentAgent()
        incident = Incident(
            id="INC-INTEGRATION-001",
            title="Database Connection Pool Exhaustion on Payments API",
            severity="SEV-1",
            service="payments-api",
            symptoms=["504 Gateway Timeout", "repeated database connection timeouts"],
            error_summary="ConnectionPoolTimeoutException: Timeout waiting for connection from pool",
            recent_deployment="Deployed release v3.0.1 with concurrency improvements",
            config_changes="MAX_POOL_CONNECTIONS=10",
            affected_components=["checkout-gateway"]
        )

        response = agent.analyze_incident(incident)

        self.assertIsNotNone(response.summary)
        self.assertGreater(len(response.hypotheses), 0)
        self.assertGreater(len(response.investigation_steps), 0)
        self.assertIn(response.hypotheses[0].confidence, ["high", "medium", "low"])

    def test_live_hindsight_recall_error_gracefulness(self):
        # Even if Hindsight is unreachable or returns unauthorized, recall_memories must not crash
        res = recall_memories("payments-api connection pool timeout")
        self.assertIsInstance(res.memory_count, int)
        self.assertIsInstance(res.memory_available, bool)


if __name__ == "__main__":
    unittest.main()
