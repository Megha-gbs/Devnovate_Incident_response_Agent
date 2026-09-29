"""
Hindsight Service Layer
Provides memory retention, context recall, formatting, and exception definitions for incident memory banks.
"""

from hindsight.client import get_hindsight_client, close_hindsight_client, BANK_ID
from hindsight.memory import (
    RecallMemoryItem,
    RecallResponseWrapper,
    RecallFetchResult,
    recall_memories,
    retain_memory,
    retain_postmortem,
    retain_resolved_incident,
    sanitize_for_retention,
)
from hindsight.formatter import format_memory_context, format_recalled_memories
from hindsight.exceptions import (
    HindsightError,
    HindsightConfigurationError,
    HindsightConnectionError,
    HindsightTimeoutError,
    HindsightAuthenticationError,
)

__all__ = [
    "get_hindsight_client",
    "close_hindsight_client",
    "BANK_ID",
    "RecallMemoryItem",
    "RecallResponseWrapper",
    "RecallFetchResult",
    "recall_memories",
    "retain_memory",
    "retain_postmortem",
    "retain_resolved_incident",
    "sanitize_for_retention",
    "format_memory_context",
    "format_recalled_memories",
    "HindsightError",
    "HindsightConfigurationError",
    "HindsightConnectionError",
    "HindsightTimeoutError",
    "HindsightAuthenticationError",
]
