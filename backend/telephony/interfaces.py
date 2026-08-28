"""
Telephony Provider Interface Module
Nexus Call OS v2.4 Enterprise

Defines the abstract base class ITelephonyProvider that every telephony adapter must implement.
The Conversation Engine and Telephony Gateway interact strictly through this interface.
"""

from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Callable, Dict, Optional


class TelephonyDirection(str, Enum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"


class TelephonyCallStatus(str, Enum):
    INITIATED = "initiated"
    RINGING = "ringing"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    BUSY = "busy"
    FAILED = "failed"
    NO_ANSWER = "no_answer"


class ITelephonyProvider(ABC):
    """Abstract Base Class for all Telephony Adapters (Twilio, Plivo, Exotel, SIP, LiveKit, WebRTC, etc.)."""

    def __init__(self, session_id: str, provider_name: str):
        self.session_id = session_id
        self.provider_name = provider_name
        self.is_connected = False
        self.is_muted = False
        self.is_on_hold = False

    @abstractmethod
    async def connect(self, connection_params: Dict[str, Any]) -> bool:
        """Establish connection with the telephony carrier stream."""
        pass

    @abstractmethod
    async def disconnect(self, reason: str = "normal_clearing") -> bool:
        """Close connection with carrier."""
        pass

    @abstractmethod
    async def answer_call(self) -> bool:
        """Answer an incoming call session."""
        pass

    @abstractmethod
    async def hangup(self, reason: str = "normal_clearing") -> bool:
        """Hang up active phone call."""
        pass

    @abstractmethod
    async def mute(self) -> bool:
        """Mute local outbound audio stream."""
        pass

    @abstractmethod
    async def unmute(self) -> bool:
        """Unmute local outbound audio stream."""
        pass

    @abstractmethod
    async def send_audio(self, pcm_payload: bytes, sample_rate: int = 8000) -> bool:
        """Send encoded audio payload to caller."""
        pass

    @abstractmethod
    async def receive_audio(self) -> Optional[bytes]:
        """Receive encoded audio payload from caller stream."""
        pass

    @abstractmethod
    async def send_dtmf(self, digits: str) -> bool:
        """Send DTMF touch tones (e.g. '1', '2#')."""
        pass

    @abstractmethod
    async def hold(self) -> bool:
        """Place active call on hold with hold music."""
        pass

    @abstractmethod
    async def resume(self) -> bool:
        """Resume call from hold state."""
        pass

    @abstractmethod
    async def transfer(self, target_number: str) -> bool:
        """Transfer call to another PSTN number or SIP URI."""
        pass
