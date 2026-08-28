"""
Call Session Entity Module
Nexus Call OS v2.4 Enterprise

Represents a single active or historical telephony call session.
"""

import time
from typing import Dict, Any, Optional

from backend.telephony.codec_manager import TelephonyCodec
from backend.telephony.interfaces import TelephonyDirection, TelephonyCallStatus
from backend.telephony.telephony_metrics import TelephonyMetricsCollector


class CallSession:
    """Represents a telephony session instance with metadata, metrics, and provider mapping."""

    def __init__(
        self,
        session_id: str,
        direction: TelephonyDirection,
        provider_name: str,
        agent_id: Optional[str] = None,
        phone_number: str = "+1234567890",
        codec: TelephonyCodec = TelephonyCodec.G711_MULAW,
    ):
        self.session_id = session_id
        self.direction = direction
        self.provider_name = provider_name
        self.agent_id = agent_id or "default_agent"
        self.phone_number = phone_number
        self.codec = codec
        self.status = TelephonyCallStatus.INITIATED
        self.conversation_id = f"conv_{session_id}"
        self.created_at = time.time()
        self.answered_at: Optional[float] = None
        self.ended_at: Optional[float] = None

        # Metrics Collector
        self.metrics = TelephonyMetricsCollector(session_id, codec=codec)

    def mark_answered(self) -> None:
        self.status = TelephonyCallStatus.IN_PROGRESS
        self.answered_at = time.time()

    def mark_ended(self, status: TelephonyCallStatus = TelephonyCallStatus.COMPLETED) -> None:
        self.status = status
        self.ended_at = time.time()

    def to_dict(self) -> Dict[str, Any]:
        duration = round((self.ended_at or time.time()) - self.created_at, 2)
        return {
            "session_id": self.session_id,
            "conversation_id": self.conversation_id,
            "direction": self.direction.value,
            "provider_name": self.provider_name,
            "agent_id": self.agent_id,
            "phone_number": self.phone_number,
            "codec": self.codec.value,
            "status": self.status.value,
            "call_duration_sec": duration,
            "metrics": self.metrics.get_telemetry(),
        }
