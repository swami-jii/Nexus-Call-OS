"""
Call Lifecycle Module
Nexus Call OS v2.4 Enterprise

Detects goodbye intents, manages call completion conditions, and triggers escalation lifecycle events.
"""

from enum import Enum
from typing import Dict, Any, Optional


class CallEndReason(str, Enum):
    NORMAL_GOODBYE = "normal_goodbye"
    USER_HANGUP = "user_hangup"
    ESCALATION_TRIGGERED = "escalation_triggered"
    TRANSFER_REQUESTED = "transfer_requested"
    MAX_DURATION_EXCEEDED = "max_duration_exceeded"
    IN_PROGRESS = "in_progress"


class CallLifecycleManager:
    """Manages the complete lifecycle of a phone call from greeting to hangup."""

    GOODBYE_KEYWORDS = ["goodbye", "bye", "see ya", "talk to you later", "have a nice day", "thank you bye", "alvida", "phir milenge"]

    def __init__(self, max_call_duration_sec: float = 600.0):
        self.max_call_duration_sec = max_call_duration_sec
        self.status = CallEndReason.IN_PROGRESS

    def evaluate_goodbye_intent(self, text: str) -> bool:
        text_lower = text.lower().strip()
        if any(w in text_lower for w in self.GOODBYE_KEYWORDS):
            self.status = CallEndReason.NORMAL_GOODBYE
            return True
        return False

    def mark_completed(self, reason: CallEndReason) -> None:
        self.status = reason

    def get_telemetry(self) -> Dict[str, Any]:
        return {
            "status": self.status.value,
            "is_ended": self.status != CallEndReason.IN_PROGRESS,
        }
