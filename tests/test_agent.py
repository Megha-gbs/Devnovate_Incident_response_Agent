import json
import unittest
from unittest.mock import patch, MagicMock

from agent.models import Incident, IncidentAnalysis
from agent.service import IncidentAgent, analyze_incident


class TestAgentService(unittest.TestCase):

    def setUp(self):
        self.incident = Incident(
            id="INC-DEMO-001",
            title="Database Connection Pool Exhaustion on Payments API",
            severity="SEV-1",
            service="payments-api",
            symptoms=["repeated database connection timeouts", "HTTP 504 Gateway Timeout"],
            error_summary="ConnectionPoolTimeoutException: pool exhausted after 30000ms",
            recent_deployment="Deployed release v2.14.0 enabling higher concurrency",
            config_changes="DB_POOL_SIZE=10",
            affected_components=["checkout-gateway", "billing-service"]
        )

    @patch("agent.service.recall_memories")
    @patch("agent.service.IncidentAgent._get_groq_client")
    def test_analyze_incident_with_memory_and_citations(self, mock_get_groq, mock_recall):
        # 1. Mock Hindsight Recall
        mock_mem = MagicMock()
        mock_mem.id = "mem-hist-001"
        mock_mem.text = (
            "INCIDENT INC-002: payments-api suffered connection pool exhaustion. "
            "Root cause: pool limit of 10 was insufficient for concurrency. "
            "Failed attempt: restarting service did not fix. "
            "Resolution: Increased pool limit to 50."
        )
        mock_mem.score = 0.95
        mock_mem.metadata = {}

        mock_wrapper = MagicMock()
        mock_wrapper.memories = [mock_mem]
        mock_wrapper.memory_available = True
        mock_wrapper.memory_count = 1
        mock_wrapper.memory_error = None
        mock_wrapper.query = "payments-api database connection timeouts"
        mock_recall.return_value = mock_wrapper

        # 2. Mock Groq LLM response
        mock_llm_payload = {
            "summary": "payments-api is experiencing connection pool exhaustion due to worker concurrency mismatch.",
            "hypotheses": [
                {
                    "title": "Database connection pool exhaustion from concurrency increase",
                    "confidence": "high",
                    "reasoning": "Observed symptoms match historical pool exhaustion described in mem-hist-001.",
                    "citations": ["mem-hist-001"]
                }
            ],
            "investigation_steps": [
                {
                    "step": 1,
                    "description": "Inspect active vs idle connection metrics on payments-api instances",
                    "why": "Confirm if connection pool is 100% saturated",
                    "citations": ["mem-hist-001"]
                }
            ],
            "memory_used": True,
            "memory_references": ["mem-hist-001"]
        }

        mock_choice = MagicMock()
        mock_choice.message.content = json.dumps(mock_llm_payload)
        mock_completion = MagicMock()
        mock_completion.choices = [mock_choice]

        mock_groq = MagicMock()
        mock_groq.chat.completions.create.return_value = mock_completion
        mock_get_groq.return_value = mock_groq

        agent = IncidentAgent(groq_api_key="mock-groq-key")
        result: IncidentAnalysis = agent.analyze_incident(self.incident)

        self.assertIsInstance(result, IncidentAnalysis)
        self.assertTrue(result.memory_used)
        self.assertEqual(result.memory_count, 1)
        self.assertIn("mem-hist-001", result.memory_references)
        self.assertEqual(result.hypotheses[0].confidence, "high")
        self.assertIn("mem-hist-001", result.hypotheses[0].citations)

    @patch("agent.service.recall_memories")
    @patch("agent.service.IncidentAgent._get_groq_client")
    def test_citation_integrity_filters_hallucinations(self, mock_get_groq, mock_recall):
        # 1. Mock memory containing only 'mem-real-123'
        mock_mem = MagicMock()
        mock_mem.id = "mem-real-123"
        mock_mem.text = "payments-api connection timeout"
        mock_mem.score = 0.90

        mock_wrapper = MagicMock()
        mock_wrapper.memories = [mock_mem]
        mock_wrapper.memory_available = True
        mock_wrapper.memory_count = 1
        mock_wrapper.memory_error = None
        mock_recall.return_value = mock_wrapper

        # 2. LLM hallucinated citation 'mem-FAKE-999'
        mock_llm_payload = {
            "summary": "Analysis with fake citation attempt",
            "hypotheses": [
                {
                    "title": "Pool exhaustion",
                    "confidence": "high",
                    "reasoning": "Reasoning with fake citations",
                    "citations": ["mem-real-123", "mem-FAKE-999"]
                }
            ],
            "investigation_steps": [
                {
                    "step": 1,
                    "description": "Check pool",
                    "why": "Verify capacity",
                    "citations": ["mem-FAKE-999"]
                }
            ],
            "memory_used": True,
            "memory_references": ["mem-real-123", "mem-FAKE-999"]
        }

        mock_choice = MagicMock()
        mock_choice.message.content = json.dumps(mock_llm_payload)
        mock_completion = MagicMock()
        mock_completion.choices = [mock_choice]

        mock_groq = MagicMock()
        mock_groq.chat.completions.create.return_value = mock_completion
        mock_get_groq.return_value = mock_groq

        agent = IncidentAgent(groq_api_key="mock-groq-key")
        result = agent.analyze_incident(self.incident)

        # Verified real citation preserved, hallucinated citation stripped
        self.assertIn("mem-real-123", result.hypotheses[0].citations)
        self.assertNotIn("mem-FAKE-999", result.hypotheses[0].citations)
        self.assertNotIn("mem-FAKE-999", result.investigation_steps[0].citations)
        self.assertNotIn("mem-FAKE-999", result.memory_references)


if __name__ == "__main__":
    unittest.main()
