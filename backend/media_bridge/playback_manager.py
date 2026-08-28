"""
Playback Manager Module
Nexus Call OS v2.4 Enterprise

Interruption-aware audio playback queue manager supporting instant queue flushing on barge-in.
"""

import asyncio
from typing import Optional
from backend.media_bridge.interfaces import AudioFrame


class PlaybackManager:
    """Manages outbound TTS audio playback queue and handles instant barge-in flushing."""

    def __init__(self):
        self._playback_queue: asyncio.Queue[AudioFrame] = asyncio.Queue()
        self.is_playing = False

    async def enqueue_frame(self, frame: AudioFrame) -> None:
        await self._playback_queue.put(frame)

    async def pop_next_frame(self) -> Optional[AudioFrame]:
        try:
            frame = await asyncio.wait_for(self._playback_queue.get(), timeout=0.05)
            self.is_playing = True
            return frame
        except asyncio.TimeoutError:
            self.is_playing = False
            return None

    def flush_on_interruption(self) -> int:
        """Instant buffer flush on barge-in interruption."""
        flushed_count = 0
        while not self._playback_queue.empty():
            try:
                self._playback_queue.get_nowait()
                flushed_count += 1
            except asyncio.QueueEmpty:
                break

        self.is_playing = False
        return flushed_count
