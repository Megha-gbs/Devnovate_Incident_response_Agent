class HindsightError(Exception):
    """Base exception for all Hindsight memory operations."""
    pass


class HindsightConfigurationError(HindsightError):
    """Raised when Hindsight environment variables or credentials are missing or invalid."""
    pass


class HindsightConnectionError(HindsightError):
    """Raised when connection to Hindsight Cloud or local service fails."""
    pass


class HindsightTimeoutError(HindsightError):
    """Raised when a Hindsight operation exceeds the timeout threshold."""
    pass


class HindsightAuthenticationError(HindsightError):
    """Raised when Hindsight returns an unauthorized (401/403) response."""
    pass
