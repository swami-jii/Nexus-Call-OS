"""
Interruption Manager Module
Nexus Call OS v2.4 Enterprise

Detects barge-in interruptions, truncates ongoing AI speech, and handles customer speaking again.
"""

import time
from typing import Callable, Optional, Dict, Any


class InterruptionManager:
    """Handles barge-in detection, speech cancellation, and interruption metrics."""

    def __init__(self, sensitivity: float = 0.85):
        self.sensitivity = sensitivity
        self.total_interruptions = 0
        self.last_interruption_at: Optional[float] = None
        self._on_bargein_cb: Optional[Callable[[], None]] = None

    def register_bargein_callback(self, callback: Callable[[], None]) -> None:
        self._on_bargein_cb = callback

    def check_bargein(self, is_ai_speaking: bool, is_user_speaking: bool) -> bool:
        """Trigger barge-in if user speaks while AI is actively speaking."""
        if is_ai_speaking and is_user_speaking:
            self.total_interruptions += 1
            self.last_interruption_at = time.time()
            if self._on_bargein_cb:
                try:
                    self._on_bargein_cb()
                except Exception:
                    pass
            return True
        return False

    def get_telemetry(self) -> Dict[str, Any]:
        return {
            "total_interruptions": self.total_interruptions,
            "last_interruption_at": self.last_interruption_at,
        }
