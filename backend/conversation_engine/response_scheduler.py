"""
Response Scheduler Module
Nexus Call OS v2.4 Enterprise

Schedules sentence chunks for TTS synthesis, manages audio streaming queues, and prevents phrase repetition.
"""

import asyncio
from typing import List, Optional, Set


class ResponseScheduler:
    """Manages audio chunk queueing and phrase repetition prevention."""

    def __init__(self):
        self._audio_queue: asyncio.Queue[bytes] = asyncio.Queue()
        self._recent_phrases: Set[str] = set()

    async def schedule_audio(self, audio_chunk: bytes) -> None:
        await self._audio_queue.put(audio_chunk)

    async def pop_audio_chunk(self) -> Optional[bytes]:
        try:
            return await asyncio.wait_for(self._audio_queue.get(), timeout=0.1)
        except asyncio.TimeoutError:
            return None

    def is_repeated_phrase(self, text: str) -> bool:
        normalized = text.lower().strip()
        if normalized in self._recent_phrases:
            return True
        self._recent_phrases.add(normalized)
        if len(self._recent_phrases) > 20:
            self._recent_phrases.pop()
        return False

    def clear_queue(self) -> int:
        cleared = self._audio_queue.qsize()
        while not self._audio_queue.empty():
            try:
                self._audio_queue.get_nowait()
            except asyncio.QueueEmpty:
                break
        return cleared
