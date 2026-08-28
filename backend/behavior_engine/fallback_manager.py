"""
Fallback Manager Module
Nexus Call OS v2.4 Enterprise

Manages graceful degradation when confidence is low or no knowledge is available.
Provides clarification prompts, human transfer triggers, and callback scheduling.
"""

from typing import Dict, Any


class FallbackManager:
    """Handles low-confidence fallback routing: clarification, human transfer, or callback."""

    def __init__(self, max_clarification_attempts: int = 2):
        self.max_clarification_attempts = max_clarification_attempts
        self.clarification_attempts = 0

    def get_fallback_action(self, confidence_score: float, intent: str) -> Dict[str, Any]:
        if confidence_score >= 0.65:
            return {"action": "answer_directly", "confidence": confidence_score}

        self.clarification_attempts += 1

        if self.clarification_attempts <= self.max_clarification_attempts:
            return {
                "action": "ask_clarification",
                "message": "I want to make sure I give you the right information. Could you please clarify what you're looking for?",
                "attempt": self.clarification_attempts,
                "confidence": confidence_score,
            }

        # Exceeded clarification attempts — escalate
        return {
            "action": "transfer_to_human",
            "message": "Let me connect you with one of our specialists who can better assist you.",
            "confidence": confidence_score,
        }

    def reset_attempts(self) -> None:
        self.clarification_attempts = 0
