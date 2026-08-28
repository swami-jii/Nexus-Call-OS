"""
Pause Manager Module
Nexus Call OS v2.4 Enterprise

Manages acoustic pauses, silence intervals, and filler word insertion ("Hmm", "Let me see...").
"""

import random
from typing import List


class PauseManager:
    """Manages acoustic micro-pauses and filler phrase insertion during latency spikes."""

    DEFAULT_FILLERS: List[str] = [
        "Hmm, let me check that...",
        "Got it, one moment...",
        "Right, looking into that for you...",
        "Sure, let me check our system...",
        "Understood, checking the details...",
    ]

    def __init__(self, latency_threshold_ms: float = 350.0):
        self.latency_threshold_ms = latency_threshold_ms

    def should_insert_filler(self, estimated_latency_ms: float) -> bool:
        return estimated_latency_ms >= self.latency_threshold_ms

    def get_filler_phrase(self) -> str:
        return random.choice(self.DEFAULT_FILLERS)
