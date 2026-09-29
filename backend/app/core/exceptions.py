"""Domain exceptions. API handlers convert these into consistent JSON errors."""


class AppError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(message, status_code=404)


class ConflictError(AppError):
    def __init__(self, message: str = "Conflict") -> None:
        super().__init__(message, status_code=409)


class ValidationAppError(AppError):
    def __init__(self, message: str = "Validation failed") -> None:
        super().__init__(message, status_code=422)


class GroqUnavailableError(AppError):
    def __init__(self, message: str = "Groq is not configured") -> None:
        super().__init__(message, status_code=503)


class GroqParseError(AppError):
    def __init__(self, message: str = "Failed to parse AI response") -> None:
        super().__init__(message, status_code=502)


class ActionNotAllowedError(AppError):
    def __init__(self, message: str = "Action is not allowed") -> None:
        super().__init__(message, status_code=403)
