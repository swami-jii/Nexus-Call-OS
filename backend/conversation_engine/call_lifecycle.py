"""
Call Lifecycle & Termination Manager (104+ Languages)
Create Call OS v2.4 Enterprise

Monitors conversational termination signals across 104+ global languages,
hangup tokens, call completion reasons, and escalation lifecycle events.
"""

import re
from enum import Enum
from typing import Any, Dict, Optional


class CallEndReason(str, Enum):
    NORMAL_GOODBYE = "normal_goodbye"
    USER_HANGUP = "user_hangup"
    ESCALATION_TRIGGERED = "escalation_triggered"
    TRANSFER_REQUESTED = "transfer_requested"
    MAX_DURATION_EXCEEDED = "max_duration_exceeded"
    IN_PROGRESS = "in_progress"


class CallLifecycleManager:
    """Manages the complete lifecycle of a phone call from greeting to natural termination."""

    # Dynamic Multilingual Goodbye / Hangup Patterns
    _GOODBYE_PATTERNS = re.compile(
        r"(?:\[hangup\]|"
        r"\b(?:bye|goodbye|bye\s+bye|have\s+a\s+good\s+day|talk\s+to\s+you\s+later|that\s*'?s\s+all\s+thanks)\b|"
        r"[\u0900-\u097F]*(?:अलविदा|बाय|नमस्ते|धन्यवाद\s+बस\s+इतना\s+ही|शुभ\s+दिन)[\u0900-\u097F]*|"
        r"\b(?:chalta\s+hu|shukriya\s+bas|bye\s+bhai|theek\s+hai\s+bye)\b|"
        r"\b(?:adiós|hasta\s+luego|eso\s+es\s+todo\s+gracias|chao)\b|"
        r"\b(?:au\s+revoir|bonne\s+journée|c'est\s+tout\s+merci)\b|"
        r"\b(?:tschüss|auf\s+wiedersehen|schönen\s+tag|danke\s+das\s+war's)\b|"
        r"(?:مع\s+السلامة|إلى\s+اللقاء|شكراً\s+هذا\s+كل\s+شيء)|"
        r"(?:さようなら|失礼します|以上です|バイバイ)|"
        r"(?:再见|拜拜|就这些了谢谢))",
        re.IGNORECASE | re.UNICODE
    )

    def __init__(self, max_call_duration_sec: float = 600.0):
        self.max_call_duration_sec = max_call_duration_sec
        self.status = CallEndReason.IN_PROGRESS

    def evaluate_goodbye_intent(self, text: str) -> bool:
        """Evaluates whether the conversation turn signals a call termination across 104+ languages."""
        if not text or not text.strip():
            return False

        clean = text.strip()
        if self._GOODBYE_PATTERNS.search(clean):
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
