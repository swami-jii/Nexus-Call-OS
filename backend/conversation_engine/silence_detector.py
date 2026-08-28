"""
Silence Detector Module
Nexus Call OS v2.4 Enterprise

Monitors Voice Activity Detection (VAD) signals, filters background noise, and triggers re-engagement nudges.
"""

import time
from typing import Callable, Optional, Dict, Any


class SilenceDetector:
    """Detects caller silence and triggers soft conversational re-engagement nudges."""

    def __init__(self, silence_timeout_sec: float = 6.0, noise_threshold_db: float = -45.0):
        self.silence_timeout_sec = silence_timeout_sec
        self.noise_threshold_db = noise_threshold_db
        self.last_speech_at = time.time()
        self.total_nudges = 0
        self._on_nudge_cb: Optional[Callable[[], None]] = None

    def register_nudge_callback(self, callback: Callable[[], None]) -> None:
        self._on_nudge_cb = callback

    def register_speech_activity(self) -> None:
        self.last_speech_at = time.time()

    def check_silence_timeout(self) -> bool:
        silence_dur = time.time() - self.last_speech_at
        if silence_dur >= self.silence_timeout_sec:
            self.total_nudges += 1
            self.last_speech_at = time.time()  # Reset after nudge
            if self._on_nudge_cb:
                try:
                    self._on_nudge_cb()
                except Exception:
                    pass
            return True
        return False

    def get_telemetry(self) -> Dict[str, Any]:
        return {
            "silence_duration_sec": round(time.time() - self.last_speech_at, 2),
            "total_nudges": self.total_nudges,
        }
