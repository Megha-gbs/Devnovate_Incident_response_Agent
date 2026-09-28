class AgentError(Exception):
    """Base exception for all Incident Agent operations."""
    pass


class AgentReasoningError(AgentError):
    """Raised when the LLM reasoning process encounters an unrecoverable failure."""
    pass


class GroqAuthenticationError(AgentError):
    """Raised when Groq API authentication fails."""
    pass


class GroqServiceUnavailableError(AgentError):
    """Raised when Groq API service is unreachable or rate limited."""
    pass


class InvalidPromptError(AgentError):
    """Raised when the prompt construction fails due to invalid incident input."""
    pass
