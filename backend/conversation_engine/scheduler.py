"""
Response Scheduler & Audio Queue Module
Schedules sentence chunks for real-time TTS synthesis and manages audio streaming order.
"""

import asyncio
from typing import Optional, List
from backend.conversation_engine.interface import AudioChunk


class ResponseScheduler:
    """Manages audio queueing and sentence chunk scheduling."""

    def __init__(self):
        self._queue: asyncio.Queue[AudioChunk] = asyncio.Queue()
        self.is_streaming = False

    async def enqueue_chunk(self, chunk: AudioChunk) -> None:
        await self._queue.put(chunk)

    async def get_next_chunk(self) -> Optional[AudioChunk]:
        try:
            return await asyncio.wait_for(self._queue.get(), timeout=0.1)
        except asyncio.TimeoutError:
            return None

    def clear_queue(self) -> int:
        cleared_count = self._queue.qsize()
        while not self._queue.empty():
            try:
                self._queue.get_nowait()
            except asyncio.QueueEmpty:
                break
        return cleared_count
