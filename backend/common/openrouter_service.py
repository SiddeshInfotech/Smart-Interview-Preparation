"""
Backwards-compatibility re-export module for common.openrouter_service.
Allows `from common.openrouter_service import generate_content, OpenRouterService` to work seamlessly.
"""

from ai.openrouter_service import (
    OpenRouterService,
    OpenRouterServiceError,
    OpenRouterAuthError,
    OpenRouterTimeoutError,
    OpenRouterHttpError,
    OpenRouterJSONError,
    openrouter_service,
    generate_content,
)

__all__ = [
    "OpenRouterService",
    "OpenRouterServiceError",
    "OpenRouterAuthError",
    "OpenRouterTimeoutError",
    "OpenRouterHttpError",
    "OpenRouterJSONError",
    "openrouter_service",
    "generate_content",
]
