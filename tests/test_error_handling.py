import unittest
from unittest.mock import patch, MagicMock

from agent.models import Incident, IncidentAnalysis
from agent.service import IncidentAgent
from hindsight.memory import recall_memories, RecallResponseWrapper


class TestErrorAndTimeoutHandling(unittest.TestCase):
    """
    Mandatory error resilience and timeout test suite covering:
    TEST 1: Hindsight available.
    TEST 2: Hindsight unavailable.
    TEST 3: Hindsight timeout.
    TEST 4: Hindsight returns no useful memories.
    TEST 5: Groq unavailable.
    TEST 6: Malformed memory response.
    """

    def setUp(self):
        self.incident = Incident(
            id="INC-ERR-001",
            title="Payments latency spike",
            service="payments-api",
            symptoms=["504 Gateway Timeout"],
            error_summary="Connection pool saturated"
        )

    # TEST 1: Hindsight available -> normal recall
    @patch("hindsight.memory.get_hindsight_client")
    def test_1_hindsight_available(self, mock_get_client):
        mock_raw = MagicMock()
        mock_raw.id = "mem-001"
        mock_raw.text = "Historical pool exhaustion incident."
        mock_raw.scores = {"similarity": 0.88}

        mock_resp = MagicMock()
        mock_resp.results = [mock_raw]

        mock_client = MagicMock()
        mock_client.recall.return_value = mock_resp
        mock_get_client.return_value = mock_client

        res = recall_memories("payments-api connection timeout", bank_id="test-bank")
        self.assertTrue(res.memory_available)
        self.assertEqual(res.memory_count, 1)
        self.assertIsNone(res.memory_error)

    # TEST 2: Hindsight unavailable -> agent continues using first-principles reasoning
    @patch("hindsight.memory.get_hindsight_client")
    def test_2_hindsight_unavailable(self, mock_get_client):
        mock_client = MagicMock()
        mock_client.recall.side_effect = ConnectionError("Failed to connect to Hindsight Cloud")
        mock_get_client.return_value = mock_client

        agent = IncidentAgent(groq_api_key="dummy-key")
        # Agent must not throw an uncaught exception
        analysis: IncidentAnalysis = agent.analyze_incident(self.incident)

        self.assertIsInstance(analysis, IncidentAnalysis)
        self.assertFalse(analysis.memory_used)
        self.assertEqual(analysis.memory_count, 0)
        self.assertGreater(len(analysis.hypotheses), 0)
        self.assertGreater(len(analysis.investigation_steps), 0)
        self.assertIn("ConnectionError", analysis.memory_error)

    # TEST 3: Hindsight timeout -> agent does not crash
    @patch("hindsight.memory.get_hindsight_client")
    def test_3_hindsight_timeout(self, mock_get_client):
        mock_client = MagicMock()
        mock_client.recall.side_effect = TimeoutError("Request timed out after 5000ms")
        mock_get_client.return_value = mock_client

        res = recall_memories("payments-api connection timeout", bank_id="test-bank")
        self.assertFalse(res.memory_available)
        self.assertEqual(res.memory_count, 0)
        self.assertIn("TimeoutError", res.memory_error)

        agent = IncidentAgent(groq_api_key="dummy-key")
        analysis = agent.analyze_incident(self.incident)
        self.assertIsInstance(analysis, IncidentAnalysis)
        self.assertFalse(analysis.memory_used)

    # TEST 4: Hindsight returns no useful memories -> memory_used = false, memory_count = 0, no fake citations
    @patch("hindsight.memory.get_hindsight_client")
    def test_4_hindsight_empty_memories(self, mock_get_client):
        mock_resp = MagicMock()
        mock_resp.results = []

        mock_client = MagicMock()
        mock_client.recall.return_value = mock_resp
        mock_get_client.return_value = mock_client

        agent = IncidentAgent(groq_api_key="dummy-key")
        analysis = agent.analyze_incident(self.incident)

        self.assertFalse(analysis.memory_used)
        self.assertEqual(analysis.memory_count, 0)
        self.assertEqual(analysis.memory_references, [])
        for hyp in analysis.hypotheses:
            self.assertEqual(hyp.citations, [])

    # TEST 5: Groq unavailable -> clean error/fallback behavior
    @patch("agent.service.recall_memories")
    @patch("agent.service.IncidentAgent._get_groq_client")
    def test_5_groq_unavailable(self, mock_get_groq, mock_recall):
        mock_wrapper = MagicMock()
        mock_wrapper.memories = []
        mock_wrapper.memory_available = False
        mock_wrapper.memory_count = 0
        mock_wrapper.memory_error = None
        mock_recall.return_value = mock_wrapper

        mock_groq = MagicMock()
        mock_groq.chat.completions.create.side_effect = RuntimeError("Groq API rate limit exceeded")
        mock_get_groq.return_value = mock_groq

        agent = IncidentAgent(groq_api_key="dummy-key")
        analysis = agent.analyze_incident(self.incident)

        self.assertIsInstance(analysis, IncidentAnalysis)
        self.assertIsNotNone(analysis.summary)
        self.assertGreater(len(analysis.hypotheses), 0)
        self.assertGreater(len(analysis.investigation_steps), 0)
        self.assertIn("RuntimeError", analysis.memory_error)

    # TEST 6: Malformed memory response -> safe handling
    @patch("hindsight.memory.get_hindsight_client")
    def test_6_malformed_memory_response(self, mock_get_client):
        # Malformed response object with non-standard structures
        mock_resp = MagicMock()
        mock_resp.results = [{"invalid_key": 12345, "text": None}, "just_a_string"]

        mock_client = MagicMock()
        mock_client.recall.return_value = mock_resp
        mock_get_client.return_value = mock_client

        res = recall_memories("malformed test", bank_id="test-bank")
        self.assertTrue(res.memory_available)
        self.assertEqual(res.memory_count, 2)
        self.assertEqual(res.memories[0].text, "None")
        self.assertEqual(res.memories[1].text, "just_a_string")


if __name__ == "__main__":
    unittest.main()
