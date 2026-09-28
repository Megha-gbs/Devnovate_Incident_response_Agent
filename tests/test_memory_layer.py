import unittest
from unittest.mock import patch, MagicMock
from hindsight.memory import (
    recall_memories,
    format_recalled_memories,
    sanitize_for_retention,
    retain_resolved_incident,
    RecallFetchResult
)


class TestHindsightMemoryLayer(unittest.TestCase):

    def test_query_construction_and_validation(self):
        # Empty query validation
        res = recall_memories("")
        self.assertFalse(res.memory_available)
        self.assertEqual(res.memory_count, 0)
        self.assertIn("empty", res.memory_error.lower())

        res_none = recall_memories(None)
        self.assertFalse(res_none.memory_available)
        self.assertEqual(res_none.memory_count, 0)

    @patch("hindsight.memory.get_hindsight_client")
    def test_recall_relevant_memory_success(self, mock_get_client):
        # Mock RecallResult item
        mock_mem = MagicMock()
        mock_mem.id = "mem-101"
        mock_mem.text = "payments-api database connection pool exhausted due to spike in traffic."
        mock_mem.type = "incident"
        mock_mem.occurred_start = "2026-08-15"
        mock_mem.scores = {"relevance": 0.95}

        mock_response = MagicMock()
        mock_response.results = [mock_mem]

        mock_client = MagicMock()
        mock_client.recall.return_value = mock_response
        mock_get_client.return_value = mock_client

        res = recall_memories("payments-api connection timeout", bank_id="test-bank")
        self.assertTrue(res.memory_available)
        self.assertEqual(res.memory_count, 1)
        self.assertIsNone(res.memory_error)
        self.assertEqual(res.memories[0].id, "mem-101")

        # Test formatting
        formatted = format_recalled_memories(res)
        self.assertIn("mem-101", formatted)
        self.assertIn("connection pool exhausted", formatted)
        self.assertIn("HISTORICAL INCIDENT MEMORY", formatted)

    @patch("hindsight.memory.get_hindsight_client")
    def test_empty_recall_handling(self, mock_get_client):
        mock_response = MagicMock()
        mock_response.results = []

        mock_client = MagicMock()
        mock_client.recall.return_value = mock_response
        mock_get_client.return_value = mock_client

        res = recall_memories("non_existent_service_query", bank_id="test-bank")
        self.assertFalse(res.memory_available)
        self.assertEqual(res.memory_count, 0)
        self.assertIsNone(res.memory_error)

        formatted = format_recalled_memories(res)
        self.assertIn("No historical memories found", formatted)

    @patch("hindsight.memory.get_hindsight_client")
    def test_hindsight_connection_failure_handling(self, mock_get_client):
        mock_client = MagicMock()
        mock_client.recall.side_effect = ConnectionError("Hindsight API gateway unreachable")
        mock_get_client.return_value = mock_client

        res = recall_memories("payments-api connection timeout", bank_id="test-bank")
        self.assertFalse(res.memory_available)
        self.assertEqual(res.memory_count, 0)
        self.assertIsNotNone(res.memory_error)
        self.assertIn("ConnectionError", res.memory_error)

        formatted = format_recalled_memories(res)
        self.assertIn("Memory retrieval note", formatted)

    def test_sanitization_of_secrets_and_pii(self):
        raw_text = (
            "Incident INC-999: payments-api error.\n"
            "Auth header: Bearer abc123def456ghi7890123456789\n"
            "Groq key: gsk_1234567890abcdef1234567890\n"
            "OpenAI key: sk-abcdefghijklmnopqrstuvwxyz123456\n"
            "Contact on-call: admin@example.com for password: supersecret123\n"
        )
        sanitized = sanitize_for_retention(raw_text)

        self.assertNotIn("abc123def456ghi7890123456789", sanitized)
        self.assertNotIn("gsk_1234567890abcdef1234567890", sanitized)
        self.assertNotIn("sk-abcdefghijklmnopqrstuvwxyz123456", sanitized)
        self.assertNotIn("admin@example.com", sanitized)
        self.assertNotIn("supersecret123", sanitized)

        self.assertIn("[REDACTED_TOKEN]", sanitized)
        self.assertIn("[REDACTED_GROQ_KEY]", sanitized)
        self.assertIn("[REDACTED_API_KEY]", sanitized)
        self.assertIn("[REDACTED_EMAIL]", sanitized)
        self.assertIn("[REDACTED_SECRET]", sanitized)

    def test_sanitization_truncation(self):
        long_log = "Error log line: DB timeout\n" * 500  # ~13,500 chars
        sanitized = sanitize_for_retention(long_log, max_chars=1000)
        self.assertLessEqual(len(sanitized), 1100)
        self.assertIn("[TRUNCATED DUE TO SIZE LIMIT]", sanitized)

    @patch("hindsight.memory.get_hindsight_client")
    def test_retain_resolved_incident(self, mock_get_client):
        mock_client = MagicMock()
        mock_client.retain.return_value = {"status": "success", "id": "mem-new-1"}
        mock_get_client.return_value = mock_client

        resolved_data = {
            "id": "INC-TEST-001",
            "service": "payments-api",
            "title": "DB pool exhaustion",
            "symptoms": ["timeouts", "500 errors"],
            "recent_changes": "v2.1 deploy",
            "root_cause": "Connection pool size was 5, needed 50",
            "failed_attempts": ["restarted app"],
            "successful_resolution": "Increased pool size to 50",
            "lessons_learned": ["Add pool metric alert"]
        }

        result = retain_resolved_incident(resolved_data, bank_id="test-bank")
        self.assertIsNotNone(result)

        # Check call arguments to client.retain
        mock_client.retain.assert_called_once()
        kwargs = mock_client.retain.call_args[1]
        self.assertIn("INCIDENT ID: INC-TEST-001", kwargs["content"])
        self.assertIn("ROOT CAUSE: Connection pool size was 5, needed 50", kwargs["content"])
        self.assertIn("SUCCESSFUL RESOLUTION: Increased pool size to 50", kwargs["content"])
        self.assertIn("service:payments-api", kwargs["tags"])


if __name__ == "__main__":
    unittest.main()
