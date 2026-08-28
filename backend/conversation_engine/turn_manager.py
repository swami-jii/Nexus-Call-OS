"""
Turn Manager Module
Nexus Call OS v2.4 Enterprise

Arbitrates speaker floor locks (User vs. AI) and resolves overlapping speech.
"""

from enum import Enum
import time
from typing import Any, Dict


class FloorOwner(str, Enum):
    USER = "user"
    AI = "ai"
    BOTH = "overlapping"
    NONE = "none"


class TurnManager:
    """Arbitrates speaker floor locks and manages overlapping speech."""

    def __init__(self, lock_timeout_sec: float = 10.0):
        self.lock_timeout_sec = lock_timeout_sec
        self.current_floor: FloorOwner = FloorOwner.NONE
        self.floor_acquired_at: float = time.time()
        self.overlapping_speech_detected = False
        self.user_turn_count = 0
        self.ai_turn_count = 0

    def acquire_floor(self, owner: FloorOwner) -> FloorOwner:
        """Acquire floor or detect overlapping speech if both speak at once."""
        now = time.time()
        if self.current_floor == FloorOwner.AI and owner == FloorOwner.USER:
            self.overlapping_speech_detected = True
            self.current_floor = FloorOwner.BOTH
        else:
            self.current_floor = owner
            self.overlapping_speech_detected = False

        self.floor_acquired_at = now
        if owner == FloorOwner.USER:
            self.user_turn_count += 1
        elif owner == FloorOwner.AI:
            self.ai_turn_count += 1

        return self.current_floor

    def release_floor(self) -> None:
        self.current_floor = FloorOwner.NONE
        self.overlapping_speech_detected = False
        self.floor_acquired_at = time.time()

    def get_telemetry(self) -> Dict[str, Any]:
        return {
            "current_floor": self.current_floor.value,
            "overlapping": self.overlapping_speech_detected,
            "user_turns": self.user_turn_count,
            "ai_turns": self.ai_turn_count,
        }
