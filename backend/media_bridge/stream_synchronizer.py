"""
Stream Synchronizer Module
Nexus Call OS v2.4 Enterprise

Synchronizes out-of-order RTP audio frames using sequence numbers and timestamp alignment.
"""

from typing import Dict, List, Optional
from backend.media_bridge.interfaces import AudioFrame


class StreamSynchronizer:
    """RTP frame synchronizer ordering out-of-order packet streams."""

    def __init__(self, buffer_depth: int = 10):
        self.buffer_depth = buffer_depth
        self._frame_store: Dict[int, AudioFrame] = {}
        self.next_expected_seq = 1

    def push_frame(self, frame: AudioFrame) -> None:
        self._frame_store[frame.sequence_number] = frame

    def pop_ordered_frames(self) -> List[AudioFrame]:
        ordered: List[AudioFrame] = []
        while self.next_expected_seq in self._frame_store:
            frame = self._frame_store.pop(self.next_expected_seq)
            ordered.append(frame)
            self.next_expected_seq += 1
        return ordered

    def flush(self) -> int:
        count = len(self._frame_store)
        self._frame_store.clear()
        return count
