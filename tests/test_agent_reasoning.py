import json
import unittest
from unittest.mock import patch, MagicMock

from agent.models import Incident, IncidentAnalysisResponse
from agent.query_builder import build_recall_query
from agent.agent import IncidentAgent


class TestAgentReasoning(unittest.TestCase):

    def setUp(self):
        self.sample_incident = Incident(
            id="INC-DEMO-001",
            title="Database connection timeouts on payments API",
            severity="SEV-1",
            service="payments-api",
            symptoms=["repeated database connection timeouts", "elevated 504 errors"],
            error_summary="ConnectionPoolTimeoutException: pool exhausted after 30000ms",
            recent_deployment="Deployed release v2.14.0 enabling batch transactions",
            config_changes="DB_POOL_SIZE=10",
            affected_components=["checkout-service", "billing-worker"]
        )

    def test_query_construction_prioritization(self):
        query = build_recall_query(self.sample_incident)
        self.assertIn("payments-api", query)
        self.assertIn("repeated database connection timeouts", query)
        self.assertIn("ConnectionPoolTimeoutException", query)
        self.assertIn("deployment", query)
        self.assertIn("config", query)
        self.assertIn("checkout-service", query)

    @patch("agent.agent.recall_memories")
    @patch("agent.agent.IncidentAgent.get_groq_client")
    def test_agent_analysis_with_memory_and_citations(self, mock_get_groq, mock_recall):
        # 1. Mock recall result
        mock_mem = MagicMock()
        mock_mem.id = "mem-hist-042"
        mock_mem.text = (
            "INCIDENT INC-002: payments-api experienced database connection exhaustion. "
            "Root cause: pool limit of 10 was insufficient for batch volume. "
            "Failed attempt: service restart did not fix. "
            "Resolution: Increased pool limit to 50."
        )
        mock_mem.type = "incident"
        mock_mem.occurred_start = "2026-07-10"
        mock_mem.scores = {"similarity": 0.92}

        mock_recall_fetch = MagicMock()
        mock_recall_fetch.memories = [mock_mem]
        mock_recall_fetch.memory_available = True
        mock_recall_fetch.memory_count = 1
        mock_recall_fetch.memory_error = None
        mock_recall_fetch.query = "payments-api database connection timeouts"
        mock_recall.return_value = mock_recall_fetch

        # 2. Mock Groq response
        mock_llm_json = {
            "summary": "payments-api is suffering from connection pool exhaustion following batch release.",
            "hypotheses": [
                {
                    "title": "Database connection pool exhaustion due to batch transactions",
                    "reason": "Recent deployment enabled batch transactions while DB_POOL_SIZE remains set to 10.",
                    "confidence": "high",
                    "citations": ["mem-hist-042", "INC-002"]
                }
            ],
            "investigation_steps": [
                {
                    "step": 1,
                    "description": "Inspect active connection pool metrics on payments-api instances",
                    "reason": "Confirm if active pool usage is at 100% capacity"
                },
                {
                    "step": 2,
                    "description": "Increase DB_POOL_SIZE environment variable from 10 to 50",
                    "reason": "Past resolution in mem-hist-042 proved 50 connections sustains batch traffic"
                }
            ],
            "memory_used": True,
            "memory_references": ["mem-hist-042"]
        }

        mock_choice = MagicMock()
        mock_choice.message.content = json.dumps(mock_llm_json)
        mock_completion = MagicMock()
        mock_completion.choices = [mock_choice]

        mock_groq = MagicMock()
        mock_groq.chat.completions.create.return_value = mock_completion
        mock_get_groq.return_value = mock_groq

        agent = IncidentAgent(groq_api_key="mock-key")
        response: IncidentAnalysisResponse = agent.analyze_incident(self.sample_incident)

        # Assertions
        self.assertIsInstance(response, IncidentAnalysisResponse)
        self.assertTrue(response.memory_used)
        self.assertEqual(response.memory_count, 1)
        self.assertIn("mem-hist-042", response.memory_references)
        self.assertEqual(len(response.hypotheses), 1)
        self.assertEqual(response.hypotheses[0].confidence, "high")
        self.assertIn("mem-hist-042", response.hypotheses[0].citations)
        self.assertEqual(len(response.investigation_steps), 2)

    @patch("agent.agent.recall_memories")
    @patch("agent.agent.IncidentAgent.get_groq_client")
    def test_agent_analysis_without_memory(self, mock_get_groq, mock_recall):
        # 1. Mock empty recall
        mock_recall_fetch = MagicMock()
        mock_recall_fetch.memories = []
        mock_recall_fetch.memory_available = False
        mock_recall_fetch.memory_count = 0
        mock_recall_fetch.memory_error = None
        mock_recall_fetch.query = "payments-api"
        mock_recall.return_value = mock_recall_fetch

        # 2. Mock Groq response for novel incident
        mock_llm_json = {
            "summary": "payments-api experiencing DB timeouts without matching historical incident memory.",
            "hypotheses": [
                {
                    "title": "Database connection saturation",
                    "reason": "Observed symptoms and timeout error suggest pool exhaustion.",
                    "confidence": "medium",
                    "citations": []
                }
            ],
            "investigation_steps": [
                {
                    "step": 1,
                    "description": "Check database server CPU and active connections",
                    "reason": "Diagnose database health directly"
                }
            ],
            "memory_used": False,
            "memory_references": []
        }

        mock_choice = MagicMock()
        mock_choice.message.content = json.dumps(mock_llm_json)
        mock_completion = MagicMock()
        mock_completion.choices = [mock_choice]

        mock_groq = MagicMock()
        mock_groq.chat.completions.create.return_value = mock_completion
        mock_get_groq.return_value = mock_groq

        agent = IncidentAgent(groq_api_key="mock-key")
        response = agent.analyze_incident(self.sample_incident)

        self.assertFalse(response.memory_used)
        self.assertEqual(response.memory_count, 0)
        self.assertEqual(response.memory_references, [])
        self.assertEqual(response.hypotheses[0].citations, [])


if __name__ == "__main__":
    unittest.main()
