import re
import logging
from typing import Any, Dict, List, Optional, Union
from dataclasses import dataclass, field

from hindsight.client import get_hindsight_client, BANK_ID
from hindsight.formatter import format_memory_context, format_recalled_memories
from hindsight.exceptions import (
    HindsightError,
    HindsightConfigurationError,
    HindsightConnectionError,
    HindsightTimeoutError,
    HindsightAuthenticationError,
)

logger = logging.getLogger(__name__)


@dataclass
class RecallMemoryItem:
    """Clean internal representation of an individual recalled memory."""
    id: str
    text: str
    score: Optional[Any] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "text": self.text,
            "score": self.score,
            "metadata": self.metadata
        }


@dataclass
class RecallResponseWrapper:
    """Structured container for Hindsight recall query outcomes."""
    memories: List[RecallMemoryItem] = field(default_factory=list)
    memory_available: bool = False
    memory_count: int = 0
    memory_error: Optional[str] = None
    query: str = ""

    def __iter__(self):
        """Allows direct iteration over retrieved memory items for backward compatibility."""
        return iter(self.memories)

    def __len__(self):
        return len(self.memories)

    def __getitem__(self, index):
        return self.memories[index]


# Alias for backward compatibility
RecallFetchResult = RecallResponseWrapper


def sanitize_for_retention(content: str, max_chars: int = 8000) -> str:
    """
    Sanitizes incident content before storing in Hindsight.
    Redacts API keys, passwords, bearer tokens, PII (emails), and caps excessive log sizes.
    """
    if not content or not isinstance(content, str):
        return ""

    sanitized = content

    # 1. Redact Bearer tokens and Authorization headers
    sanitized = re.sub(r'(?i)bearer\s+[a-zA-Z0-9_\-\.]{15,}', 'Bearer [REDACTED_TOKEN]', sanitized)
    sanitized = re.sub(
        r'(?i)(authorization|auth_token|api_token|apikey|api_key|secret|password|passwd|pwd)\s*[:=]\s*["\']?[^"\'\s,\n]{6,}["\']?',
        r'\1: [REDACTED_SECRET]',
        sanitized
    )

    # 2. Redact common secret patterns (OpenAI, Groq, GitHub PATs)
    sanitized = re.sub(r'gsk_[a-zA-Z0-9]{20,}', '[REDACTED_GROQ_KEY]', sanitized)
    sanitized = re.sub(r'sk-[a-zA-Z0-9]{20,}', '[REDACTED_API_KEY]', sanitized)
    sanitized = re.sub(r'ghp_[a-zA-Z0-9]{20,}', '[REDACTED_GITHUB_PAT]', sanitized)

    # 3. Redact Email addresses
    sanitized = re.sub(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', '[REDACTED_EMAIL]', sanitized)

    # 4. Truncate oversized content to prevent storing multi-MB logs
    if len(sanitized) > max_chars:
        sanitized = sanitized[:max_chars] + "\n... [TRUNCATED DUE TO SIZE LIMIT]"

    return sanitized.strip()


def retain_memory(
    content: str,
    bank_id: Optional[str] = None,
    tags: Optional[List[str]] = None,
    metadata: Optional[Dict[str, str]] = None
) -> Any:
    """
    Retains sanitized memory content in the Hindsight bank.
    """
    target_bank = bank_id or BANK_ID
    if not target_bank:
        raise HindsightConfigurationError("Bank ID is required for Hindsight retain.")

    if not content or not isinstance(content, str) or not content.strip():
        raise ValueError("Content to retain cannot be empty.")

    sanitized_content = sanitize_for_retention(content)
    client = get_hindsight_client()

    kwargs: Dict[str, Any] = {
        "bank_id": target_bank,
        "content": sanitized_content
    }
    if tags:
        kwargs["tags"] = tags
    if metadata:
        kwargs["metadata"] = metadata

    return client.retain(**kwargs)


def recall_memories(
    query: str,
    bank_id: Optional[str] = None,
    limit: int = 5
) -> RecallResponseWrapper:
    """
    Recalls relevant memories from Hindsight bank with comprehensive error handling.
    Returns a RecallResponseWrapper containing parsed RecallMemoryItem objects.
    """
    target_bank = bank_id or BANK_ID

    # Validate query input
    if not query or not isinstance(query, str) or not query.strip():
        return RecallResponseWrapper(
            memories=[],
            memory_available=False,
            memory_count=0,
            memory_error="Query is empty or malformed",
            query=str(query) if query is not None else ""
        )

    clean_query = query.strip()

    try:
        client = get_hindsight_client()
        response = client.recall(
            bank_id=target_bank,
            query=clean_query
        )

        raw_items = []
        if hasattr(response, "results") and response.results is not None:
            raw_items = list(response.results)
        elif hasattr(response, "__iter__"):
            raw_items = list(response)
        elif isinstance(response, list):
            raw_items = response

        # Convert to clean internal representation (RecallMemoryItem)
        parsed_memories: List[RecallMemoryItem] = []
        for idx, item in enumerate(raw_items[:limit], 1):
            if isinstance(item, dict):
                mem_id = item.get("id") or f"mem-{idx}"
                text = item.get("text", "")
                score = item.get("score")
                meta = item.get("metadata", {})
            elif isinstance(item, str):
                mem_id = f"mem-{idx}"
                text = item
                score = None
                meta = {}
            else:
                mem_id = getattr(item, "id", None) or f"mem-{idx}"
                text = getattr(item, "text", "")
                score = getattr(item, "scores", None) or getattr(item, "score", None)
                meta = getattr(item, "metadata", {}) or {}

            parsed_memories.append(
                RecallMemoryItem(
                    id=str(mem_id),
                    text=str(text),
                    score=score,
                    metadata=meta if isinstance(meta, dict) else {}
                )
            )

        count = len(parsed_memories)
        return RecallResponseWrapper(
            memories=parsed_memories,
            memory_available=count > 0,
            memory_count=count,
            memory_error=None,
            query=clean_query
        )

    except ValueError as ve:
        logger.warning(f"Hindsight configuration error: {ve}")
        return RecallResponseWrapper(
            memories=[],
            memory_available=False,
            memory_count=0,
            memory_error=f"ConfigurationError: {str(ve)}",
            query=clean_query
        )
    except Exception as e:
        logger.warning(f"Hindsight recall failed: {e}")
        return RecallResponseWrapper(
            memories=[],
            memory_available=False,
            memory_count=0,
            memory_error=f"{type(e).__name__}: {str(e)}",
            query=clean_query
        )


def retain_postmortem(
    incident: Union[Dict[str, Any], Any],
    postmortem: Optional[Union[Dict[str, Any], Any, str]] = None,
    bank_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Retains an approved post-mortem and incident learning in Hindsight.
    Accepts combined incident/postmortem data or separate incident and postmortem arguments.
    """
    def get_val(source: Any, key: str, default: Any = None) -> Any:
        if source is None:
            return default
        if isinstance(source, dict):
            return source.get(key, default)
        return getattr(source, key, default)

    # Normalize incident fields
    inc_id = get_val(incident, "id") or get_val(incident, "incident_id") or "UNKNOWN-INCIDENT"
    service = get_val(incident, "service", "unknown-service")
    title = get_val(incident, "title", "")
    symptoms = get_val(incident, "symptoms", "")
    recent_changes = (
        get_val(incident, "recent_changes")
        or get_val(incident, "recent_deployment")
        or get_val(incident, "config_changes")
        or "None reported"
    )

    # Normalize postmortem fields
    if isinstance(postmortem, str):
        root_cause = "See post-mortem text"
        successful_resolution = "See post-mortem text"
        failed_attempts = "None recorded"
        lessons_learned = ""
        postmortem_text = postmortem
    else:
        pm_source = postmortem if postmortem is not None else incident
        root_cause = get_val(pm_source, "root_cause", "Under investigation / Not specified")
        successful_resolution = (
            get_val(pm_source, "successful_resolution")
            or get_val(pm_source, "resolution")
            or get_val(pm_source, "successful_steps", "Not specified")
        )
        failed_attempts = get_val(pm_source, "failed_attempts", "None recorded")
        lessons_learned = get_val(pm_source, "lessons_learned", "")
        postmortem_text = get_val(pm_source, "post_mortem") or get_val(pm_source, "postmortem", "")

    if isinstance(symptoms, list):
        symptoms = ", ".join(str(s) for s in symptoms)
    if isinstance(failed_attempts, list):
        failed_attempts = "; ".join(str(f) for f in failed_attempts)
    if isinstance(lessons_learned, list):
        lessons_learned = "; ".join(str(l) for l in lessons_learned)

    narrative_lines = [
        f"INCIDENT ID: {inc_id}",
        f"SERVICE: {service}",
    ]
    if title:
        narrative_lines.append(f"TITLE: {title}")
    narrative_lines.extend([
        f"SYMPTOMS: {symptoms}",
        f"RECENT CHANGES: {recent_changes}",
        f"ROOT CAUSE: {root_cause}",
        f"FAILED ATTEMPTS: {failed_attempts}",
        f"SUCCESSFUL RESOLUTION: {successful_resolution}",
    ])
    if lessons_learned:
        narrative_lines.append(f"LESSONS LEARNED: {lessons_learned}")
    if postmortem_text:
        narrative_lines.append(f"POST-MORTEM NOTES: {postmortem_text}")

    content = "\n".join(narrative_lines)
    tags = ["incident", f"service:{service}", f"incident:{inc_id}"]

    try:
        result = retain_memory(
            content=content,
            bank_id=bank_id,
            tags=tags,
            metadata={"incident_id": str(inc_id), "service": str(service)}
        )
        return {
            "success": True,
            "incident_id": inc_id,
            "service": service,
            "message": f"Post-mortem for {inc_id} successfully retained in Hindsight bank.",
            "raw_result": result
        }
    except Exception as e:
        logger.warning(f"Failed to retain post-mortem for {inc_id}: {e}")
        return {
            "success": False,
            "incident_id": inc_id,
            "service": service,
            "error": f"Retention failed: {type(e).__name__} - {str(e)}"
        }


# Alias for backward compatibility
retain_resolved_incident = retain_postmortem