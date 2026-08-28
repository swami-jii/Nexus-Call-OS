"""
Call Termination & Disconnect Classifier Module
Determines when a conversation should end (caller hangup, intent completed, error limit, max duration).
"""

from enum import Enum
from typing import Dict, Any


class DisconnectReason(str, Enum):
    USER_HANGUP = "user_hangup"
    INTENT_COMPLETED = "intent_completed"
    MAX_DURATION_REACHED = "max_duration_reached"
    ERROR_LIMIT_EXCEEDED = "error_limit_exceeded"
    TRANSFER_INITIATED = "transfer_initiated"
    NORMAL_CLEARING = "normal_clearing"


class TerminationManager:
    """Manages termination conditions and disconnect classifications."""

    def __init__(self, max_duration_sec: float = 600.0, max_errors: int = 3):
        self.max_duration_sec = max_duration_sec
        self.max_errors = max_errors
        self.is_terminated = False
        self.disconnect_reason: DisconnectReason = DisconnectReason.NORMAL_CLEARING

    def check_termination_criteria(
        self,
        call_duration_sec: float,
        error_count: int,
        user_hungup: bool = False,
        completed_intent: bool = False,
    ) -> bool:
        if user_hungup:
            self.disconnect_reason = DisconnectReason.USER_HANGUP
            self.is_terminated = True
        elif call_duration_sec >= self.max_duration_sec:
            self.disconnect_reason = DisconnectReason.MAX_DURATION_REACHED
            self.is_terminated = True
        elif error_count >= self.max_errors:
            self.disconnect_reason = DisconnectReason.ERROR_LIMIT_EXCEEDED
            self.is_terminated = True
        elif completed_intent:
            self.disconnect_reason = DisconnectReason.INTENT_COMPLETED
            self.is_terminated = True

        return self.is_terminated

    def get_summary(self) -> Dict[str, Any]:
        return {
            "is_terminated": self.is_terminated,
            "reason": self.disconnect_reason.value,
        }
