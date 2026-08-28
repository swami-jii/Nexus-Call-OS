"""
Audio Stream Module
Nexus Call OS v2.4 Enterprise

Bi-directional audio stream pipeline linking carrier audio stream and engine audio processing.
"""

import asyncio
from typing import Optional
from backend.telephony.audio_buffer import JitterBuffer


class AudioStreamPipeline:
    """Manages bi-directional audio streaming pipelines."""

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.inbound_jitter_buffer = JitterBuffer()
        self.outbound_audio_queue: asyncio.Queue[bytes] = asyncio.Queue()
        self.is_active = False

    async def push_inbound_pcm(self, pcm_data: bytes) -> None:
        self.inbound_jitter_buffer.push(pcm_data)

    async def pop_inbound_pcm(self) -> Optional[bytes]:
        return self.inbound_jitter_buffer.pop()

    async def push_outbound_pcm(self, pcm_data: bytes) -> None:
        await self.outbound_audio_queue.put(pcm_data)

    async def pop_outbound_pcm(self) -> Optional[bytes]:
        try:
            return await asyncio.wait_for(self.outbound_audio_queue.get(), timeout=0.1)
        except asyncio.TimeoutError:
            return None

    def flush_streams(self) -> int:
        cleared_inbound = self.inbound_jitter_buffer.clear()
        cleared_outbound = 0
        while not self.outbound_audio_queue.empty():
            try:
                self.outbound_audio_queue.get_nowait()
                cleared_outbound += 1
            except asyncio.QueueEmpty:
                break
        return cleared_inbound + cleared_outbound
