"""
Audio Chunker Module
Nexus Call OS v2.4 Enterprise

Slices continuous audio byte streams into strict 20ms audio frame packets.
At 8kHz 16-bit mono PCM: 1 frame = 320 bytes (8000 * 2 * 0.02).
At 16kHz 16-bit mono PCM: 1 frame = 640 bytes.
"""

from typing import List
from backend.media_bridge.interfaces import AudioFrame, MediaCodec


class AudioChunker:
    """Slices continuous audio buffers into 20ms frames."""

    def __init__(self, sample_rate: int = 8000, codec: MediaCodec = MediaCodec.PCM):
        self.sample_rate = sample_rate
        self.codec = codec
        self.bytes_per_20ms_frame = int(sample_rate * 2 * 0.02)  # 16-bit mono = 2 bytes/sample
        self._accumulator: bytes = b""
        self.sequence_counter = 0

    def push_bytes(self, raw_bytes: bytes) -> List[AudioFrame]:
        """Accumulate bytes and return any complete 20ms frames."""
        self._accumulator += raw_bytes
        frames: List[AudioFrame] = []

        while len(self._accumulator) >= self.bytes_per_20ms_frame:
            frame_payload = self._accumulator[: self.bytes_per_20ms_frame]
            self._accumulator = self._accumulator[self.bytes_per_20ms_frame :]
            self.sequence_counter += 1

            frames.append(
                AudioFrame(
                    payload=frame_payload,
                    sample_rate=self.sample_rate,
                    codec=self.codec,
                    sequence_number=self.sequence_counter,
                )
            )

        return frames

    def flush_remaining(self) -> List[AudioFrame]:
        """Pad and flush remaining buffer as a final 20ms frame."""
        if not self._accumulator:
            return []

        padded = self._accumulator.ljust(self.bytes_per_20ms_frame, b"\x00")
        self._accumulator = b""
        self.sequence_counter += 1

        return [
            AudioFrame(
                payload=padded,
                sample_rate=self.sample_rate,
                codec=self.codec,
                sequence_number=self.sequence_counter,
            )
        ]
