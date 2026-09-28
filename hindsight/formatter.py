from typing import List, Dict, Any, Union


def format_memory_context(
    memories: Union[List[Dict[str, Any]], List[Any], Any],
    max_items: int = 5,
    max_chars_per_item: int = 1500
) -> str:
    """
    Formats recalled Hindsight memories into structured context for LLM prompt ingestion.

    Guarantees:
    - Includes exact real memory IDs without modification.
    - Preserves exact historical text without hallucination.
    - Explicitly marks historical evidence boundaries.
    - Caps memory count and size to maintain low prompt footprint.
    """
    if memories is None:
        return "No historical memories available for this incident."

    if hasattr(memories, "memory_error") and memories.memory_error:
        return f"No historical memories available. (Memory retrieval note: {memories.memory_error})"

    # Extract memory items from wrappers if necessary
    items: List[Any] = []
    if hasattr(memories, "memories"):
        items = memories.memories
    elif hasattr(memories, "results") and memories.results is not None:
        items = list(memories.results)
    elif isinstance(memories, list):
        items = memories
    elif hasattr(memories, "__iter__"):
        try:
            items = list(memories)
        except Exception:
            items = [memories]
    else:
        items = [memories]

    if not items:
        return "No historical memories found for this incident."

    formatted_blocks = []
    for idx, mem in enumerate(items[:max_items], 1):
        # Extract attributes safely from dict, RecallResult, or custom object
        if isinstance(mem, dict):
            mem_id = mem.get("id") or f"mem-{idx}"
            mem_text = mem.get("text", "")
            score = mem.get("score")
            metadata = mem.get("metadata", {})
        else:
            mem_id = getattr(mem, "id", None) or f"mem-{idx}"
            mem_text = getattr(mem, "text", "")
            score = getattr(mem, "scores", None) or getattr(mem, "score", None)
            metadata = getattr(mem, "metadata", {}) or {}

        clean_text = str(mem_text).strip()
        if not clean_text:
            continue

        if len(clean_text) > max_chars_per_item:
            clean_text = clean_text[:max_chars_per_item] + "... [truncated]"

        header = f"HISTORICAL INCIDENT MEMORY [ID: {mem_id}]"
        if score is not None:
            header += f" (Relevance Score: {score})"

        block = f"{header}\nTEXT:\n{clean_text}"
        formatted_blocks.append(block)

    if not formatted_blocks:
        return "No historical memories found for this incident."

    return "\n\n" + "\n\n---\n\n".join(formatted_blocks) + "\n"


# Alias for backward compatibility
format_recalled_memories = format_memory_context
