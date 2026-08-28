"""
Fallback & Recovery Guardrails Module
Handles network glitches, API rate-limit errors, and unexpected exceptions with graceful audio fallbacks.
"""

from typing import Dict, Any


class FallbackHandler:
    """Manages system error fallbacks and connection recovery."""

    DEFAULT_FALLBACK_RESPONSE = "I am experiencing a momentary connection delay. Could you please repeat that?"

    def __init__(self):
        self.error_count = 0

    def handle_error(self, error: Exception) -> Dict[str, Any]:
        self.error_count += 1
        return {
            "fallback_text": self.DEFAULT_FALLBACK_RESPONSE,
            "error_message": str(error),
            "total_errors": self.error_count,
        }
