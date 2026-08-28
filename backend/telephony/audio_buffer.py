"""
Audio Buffer Module
Nexus Call OS v2.4 Enterprise

Jitter buffer & ring buffer for smoothing incoming audio frames from telephony streams.
"""

from typing import List, Optional


class JitterBuffer:
    """Jitter buffer smoothing real-time audio packet arrival variance."""

    def __init__(self, capacity_frames: int = 50):
        self.capacity_frames = capacity_frames
        self._buffer: List[bytes] = []

    def push(self, pcm_frame: bytes) -> bool:
        if len(self._buffer) >= self.capacity_frames:
            self._buffer.pop(0)  # Drop oldest frame on overflow
        self._buffer.append(pcm_frame)
        return True

    def pop(self) -> Optional[bytes]:
        if self._buffer:
            return self._buffer.pop(0)
        return None

    def clear(self) -> int:
        count = len(self._buffer)
        self._buffer.clear()
        return count
