"""
Audio Clock Module
Nexus Call OS v2.4 Enterprise

Monitors wall-clock time vs. audio frame timestamp drift and applies drift compensation.
"""

import time
from typing import Dict, Any


class AudioClock:
    """Manages audio timebase and calculates clock skew / drift."""

    def __init__(self, sample_rate: int = 8000):
        self.sample_rate = sample_rate
        self.start_wall_time = time.time()
        self.total_samples_processed = 0

    def tick_frame(self, frame_samples: int = 160) -> float:
        """Advance timebase by processed samples and return expected timestamp ms."""
        self.total_samples_processed += frame_samples
        expected_audio_time_sec = self.total_samples_processed / self.sample_rate
        return expected_audio_time_sec * 1000

    def calculate_drift_ms(self) -> float:
        """Calculate drift between actual wall clock elapsed time and audio sample timebase."""
        elapsed_wall_sec = time.time() - self.start_wall_time
        audio_sec = self.total_samples_processed / self.sample_rate
        drift_sec = elapsed_wall_sec - audio_sec
        return round(drift_sec * 1000, 2)

    def get_telemetry(self) -> Dict[str, Any]:
        return {
            "total_samples": self.total_samples_processed,
            "sample_rate_hz": self.sample_rate,
            "drift_ms": self.calculate_drift_ms(),
            "uptime_sec": round(time.time() - self.start_wall_time, 2),
        }
