"""
Interruption & Barge-In Handler Module
Detects user speech during AI playback, clears stream buffers, and truncates AI turns.
"""

import time
from typing import Callable, Optional


class InterruptionHandler:
    """Handles barge-in detection and stream cancellation."""

    def __init__(self, sensitivity: float = 0.85):
        self.sensitivity = sensitivity
        self.interruption_count = 0
        self.last_interruption_at: Optional[float] = None
        self._on_bargein_cb: Optional[Callable[[], None]] = None

    def register_bargein_callback(self, callback: Callable[[], None]) -> None:
        self._on_bargein_cb = callback

    def detect_barge_in(self, is_ai_speaking: bool, user_vad_signal: bool) -> bool:
        """Trigger barge-in if user speech is detected while AI is actively speaking."""
        if is_ai_speaking and user_vad_signal:
            self.interruption_count += 1
            self.last_interruption_at = time.time()
            if self._on_bargein_cb:
                try:
                    self._on_bargein_cb()
                except Exception:
                    pass
            return True
        return False
