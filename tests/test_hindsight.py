import unittest
from unittest.mock import patch, MagicMock

from hindsight.memory import (
    recall_memories,
    retain_memory,
    retain_postmortem,
    sanitize_for_retention,
    RecallResponseWrapper,
    RecallMemoryItem,
)
from hindsight.formatter import format_memory_context


class TestHindsightService(unittest.TestCase):

    @patch("hindsight.memory.get_hindsight_client")
    def test_recall_memories_success(self, mock_get_client):
        # Mock RecallResult item
        mock_raw = MagicMock()
        mock_raw.id = "mem-rec-001"
        mock_raw.text = "payments-api database connection pool exhausted during traffic surge."
        mock_raw.scores = {"similarity": 0.94}
        mock_raw.metadata = {"service": "payments-api"}

        mock_response = MagicMock()
        mock_response.results = [mock_raw]

        mock_client = MagicMock()
        mock_client.recall.return_value = mock_response
        mock_get_client.return_value = mock_client

        result: RecallResponseWrapper = recall_memories("payments-api connection timeout", bank_id="test-bank")

        self.assertTrue(result.memory_available)
        self.assertEqual(result.memory_count, 1)
        self.assertIsNone(result.memory_error)
        self.assertEqual(result.memories[0].id, "mem-rec-001")
        self.assertEqual(result.memories[0].score, {"similarity": 0.94})

        # Test context formatting
        formatted = format_memory_context(result)
        self.assertIn("mem-rec-001", formatted)
        self.assertIn("connection pool exhausted", formatted)
        self.assertIn("HISTORICAL INCIDENT MEMORY", formatted)

    def test_empty_query_handling(self):
        res = recall_memories("")
        self.assertFalse(res.memory_available)
        self.assertEqual(res.memory_count, 0)
        self.assertIn("empty", res.memory_error.lower())

    def test_sanitization_secrets_and_pii(self):
        content = (
            "Incident INC-888: payments-api outage.\n"
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret1234567890\n"
            "Groq key: gsk_1234567890abcdef1234567890\n"
            "OpenAI key: sk-abcdefghijklmnopqrstuvwxyz123456\n"
            "GitHub PAT: ghp_1234567890abcdefghijklmnopqrstuv\n"
            "Contact on-call sreadmin@example.com for db password: ProductionPassword123\n"
        )
        sanitized = sanitize_for_retention(content)

        self.assertNotIn("secret1234567890", sanitized)
        self.assertNotIn("gsk_1234567890abcdef1234567890", sanitized)
        self.assertNotIn("sk-abcdefghijklmnopqrstuvwxyz123456", sanitized)
        self.assertNotIn("ghp_1234567890abcdefghijklmnopqrstuv", sanitized)
        self.assertNotIn("sreadmin@example.com", sanitized)
        self.assertNotIn("ProductionPassword123", sanitized)

        self.assertIn("[REDACTED_TOKEN]", sanitized)
        self.assertIn("[REDACTED_GROQ_KEY]", sanitized)
        self.assertIn("[REDACTED_API_KEY]", sanitized)
        self.assertIn("[REDACTED_GITHUB_PAT]", sanitized)
        self.assertIn("[REDACTED_EMAIL]", sanitized)
        self.assertIn("[REDACTED_SECRET]", sanitized)

    @patch("hindsight.memory.get_hindsight_client")
    def test_retain_postmortem_formatting(self, mock_get_client):
        mock_client = MagicMock()
        mock_client.retain.return_value = {"status": "success", "id": "mem-new-postmortem"}
        mock_get_client.return_value = mock_client

        incident_data = {
            "id": "INC-001",
            "service": "payments-api",
            "title": "DB pool exhaustion",
            "symptoms": ["timeouts", "504 errors"],
            "recent_deployment": "v2.14.0",
        }
        postmortem_data = {
            "root_cause": "Connection pool size was 10, needed 50",
            "failed_attempts": ["restarted app"],
            "successful_resolution": "Increased pool size to 50",
            "lessons_learned": ["Add pool metric alert"],
            "post_mortem": "Resolved in 15 mins"
        }

        result = retain_postmortem(incident=incident_data, postmortem=postmortem_data, bank_id="test-bank")
        self.assertTrue(result["success"])
        self.assertEqual(result["incident_id"], "INC-001")

        mock_client.retain.assert_called_once()
        retained_content = mock_client.retain.call_args[1]["content"]
        self.assertIn("INCIDENT ID: INC-001", retained_content)
        self.assertIn("SERVICE: payments-api", retained_content)
        self.assertIn("ROOT CAUSE: Connection pool size was 10, needed 50", retained_content)
        self.assertIn("SUCCESSFUL RESOLUTION: Increased pool size to 50", retained_content)


if __name__ == "__main__":
    unittest.main()
