"""
Backwards compatibility layer for legacy gemini_service imports.
Delegates all AI requests to the new OpenRouter service.
"""

from .openrouter_service import generate_content as openrouter_generate_content


def generate_content(prompt: str, feature: str = "quiz") -> str:
    """
    Backwards-compatible wrapper function for generate_content.
    Delegates directly to OpenRouter Service.
    """
    return openrouter_generate_content(prompt=prompt, feature=feature)