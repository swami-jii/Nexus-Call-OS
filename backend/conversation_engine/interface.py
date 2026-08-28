"""
Provider-Agnostic Telephony Interface
Allows the Conversation Engine to work with any current or future telephony provider
(Twilio, Plivo, LiveKit, Android Gateway, Generic SIP, etc.).
"""

from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Callable, Dict, Optional


class TelephonyProviderType(str, Enum):
    TWILIO = "twilio"
    PLIVO = "plivo"
    LIVEKIT = "livekit"
    ANDROID_GATEWAY = "android_gateway"
    SIP = "sip"
    WEBRTC = "webrtc"
    SIMULATED = "simulated"


class AudioChunk:
    def __init__(
        self,
        payload: bytes,
        sample_rate: int = 8000,
        encoding: str = "mulaw",
        duration_ms: int = 20,
        speaker: str = "user",
    ):
        self.payload = payload
        self.sample_rate = sample_rate
        self.encoding = encoding
        self.duration_ms = duration_ms
        self.speaker = speaker


class BaseTelephonyAdapter(ABC):
    """Abstract Base Class for all Telephony Provider Adapters."""

    def __init__(self, session_id: str, provider_type: TelephonyProviderType):
        self.session_id = session_id
        self.provider_type = provider_type
        self.is_connected = False
        self._on_audio_cb: Optional[Callable[[AudioChunk], None]] = None
        self._on_hangup_cb: Optional[Callable[[str], None]] = None

    def register_audio_handler(self, callback: Callable[[AudioChunk], None]) -> None:
        self._on_audio_cb = callback

    def register_hangup_handler(self, callback: Callable[[str], None]) -> None:
        self._on_hangup_cb = callback

    @abstractmethod
    async def connect(self, metadata: Dict[str, Any]) -> bool:
        """Initialize provider connection."""
        pass

    @abstractmethod
    async def send_audio(self, chunk: AudioChunk) -> bool:
        """Stream an audio chunk back to the caller."""
        pass

    @abstractmethod
    async def clear_buffer(self) -> bool:
        """Clear queued audio on barge-in / interruption."""
        pass

    @abstractmethod
    async def hangup(self, reason: str = "normal_clearing") -> bool:
        """Disconnect the telephony stream."""
        pass


class SimulatedTelephonyAdapter(BaseTelephonyAdapter):
    """Local simulation adapter for testing and playground execution."""

    def __init__(self, session_id: str):
        super().__init__(session_id, TelephonyProviderType.SIMULATED)
        self.sent_chunks: list[AudioChunk] = []

    async def connect(self, metadata: Dict[str, Any]) -> bool:
        self.is_connected = True
        return True

    async def send_audio(self, chunk: AudioChunk) -> bool:
        self.sent_chunks.append(chunk)
        return True

    async def clear_buffer(self) -> bool:
        self.sent_chunks.clear()
        return True

    async def hangup(self, reason: str = "normal_clearing") -> bool:
        self.is_connected = False
        if self._on_hangup_cb:
            self._on_hangup_cb(reason)
        return True
