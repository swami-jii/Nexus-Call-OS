"""
Media Bridge Interface Module
Nexus Call OS v2.4 Enterprise

Defines abstract audio frames, audio processors, and streaming pipeline interfaces.
Decouples audio transport mechanics from higher-level telephony and AI engines.
"""

from abc import ABC, abstractmethod
from enum import Enum
import time
from typing import Any, Dict, Optional


class MediaCodec(str, Enum):
    PCM = "pcm"
    LINEAR16 = "linear16"
    G711_MULAW = "g711_mulaw"
    G711_ALAW = "g711_alaw"
    OPUS = "opus"


class AudioFrame:
    """Represents a 20ms audio frame packet payload."""

    def __init__(
        self,
        payload: bytes,
        sample_rate: int = 8000,
        channels: int = 1,
        codec: MediaCodec = MediaCodec.PCM,
        timestamp_ms: Optional[float] = None,
        sequence_number: int = 0,
    ):
        self.payload = payload
        self.sample_rate = sample_rate
        self.channels = channels
        self.codec = codec
        self.timestamp_ms = timestamp_ms or time.time() * 1000
        self.sequence_number = sequence_number

    @property
    def duration_ms(self) -> float:
        # Standard 20ms frame duration
        return 20.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "size_bytes": len(self.payload),
            "sample_rate": self.sample_rate,
            "channels": self.channels,
            "codec": self.codec.value,
            "duration_ms": self.duration_ms,
            "sequence_number": self.sequence_number,
        }


class IAudioProcessor(ABC):
    """Abstract interface for audio frame processors (VAD, AEC, Noise Suppressor, Resampler)."""

    @abstractmethod
    def process_frame(self, frame: AudioFrame) -> AudioFrame:
        """Process an incoming 20ms audio frame."""
        pass
