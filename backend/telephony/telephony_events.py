"""
Telephony Events Module
Nexus Call OS v2.4 Enterprise

Defines event types and event payloads for the Telephony Event Bus.
"""

from enum import Enum
import time
from typing import Any, Dict, Optional


class TelephonyEventType(str, Enum):
    INCOMING_CALL = "incoming_call"
    OUTGOING_CALL = "outgoing_call"
    CALL_ANSWERED = "call_answered"
    CALL_ENDED = "call_ended"
    TRANSFER = "transfer"
    HOLD = "hold"
    RESUME = "resume"
    DTMF = "dtmf"
    RECORDING_STARTED = "recording_started"
    RECORDING_STOPPED = "recording_stopped"
    NETWORK_LOST = "network_lost"
    RECONNECT = "reconnect"


class TelephonyEvent:
    """Represents a telephony event published to the Telephony Event Bus."""

    def __init__(
        self,
        event_type: TelephonyEventType,
        session_id: str,
        provider_name: str,
        payload: Optional[Dict[str, Any]] = None,
    ):
        self.event_type = event_type
        self.session_id = session_id
        self.provider_name = provider_name
        self.payload = payload or {}
        self.timestamp = time.time()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_type": self.event_type.value,
            "session_id": self.session_id,
            "provider_name": self.provider_name,
            "payload": self.payload,
            "timestamp": self.timestamp,
        }
