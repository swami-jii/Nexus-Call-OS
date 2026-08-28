"""
Turn-Taking Manager Module
Controls speaker floor ownership, turn lock timeouts, and dual-speaker resolution.
"""

from enum import Enum
import time
from typing import Dict, Any


class SpeakerFloor(str, Enum):
    USER = "user"
    AI = "ai"
    NEUTRAL = "neutral"


class TurnTakingManager:
    """Manages floor locks and active turn arbitration."""

    def __init__(self, lock_timeout_sec: float = 8.0):
        self.lock_timeout_sec = lock_timeout_sec
        self._current_floor: SpeakerFloor = SpeakerFloor.NEUTRAL
        self._floor_claimed_at: float = time.time()
        self._user_turns_count = 0
        self._ai_turns_count = 0

    @property
    def active_floor(self) -> SpeakerFloor:
        # Check if floor lock timed out
        if self._current_floor != SpeakerFloor.NEUTRAL:
            if time.time() - self._floor_claimed_at > self.lock_timeout_sec:
                self._current_floor = SpeakerFloor.NEUTRAL
        return self._current_floor

    def claim_floor(self, speaker: SpeakerFloor) -> bool:
        """Attempt to claim the speaker floor."""
        self._current_floor = speaker
        self._floor_claimed_at = time.time()
        if speaker == SpeakerFloor.USER:
            self._user_turns_count += 1
        elif speaker == SpeakerFloor.AI:
            self._ai_turns_count += 1
        return True

    def release_floor(self) -> None:
        """Release floor back to neutral."""
        self._current_floor = SpeakerFloor.NEUTRAL
        self._floor_claimed_at = time.time()

    def get_stats(self) -> Dict[str, Any]:
        return {
            "active_floor": self.active_floor.value,
            "user_turns": self._user_turns_count,
            "ai_turns": self._ai_turns_count,
            "floor_duration_sec": round(time.time() - self._floor_claimed_at, 2),
        }
