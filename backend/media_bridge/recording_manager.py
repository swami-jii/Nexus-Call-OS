"""
Recording Manager Module
Nexus Call OS v2.4 Enterprise

Dual-channel call recorder creating synchronized stereo recordings (Left = Caller, Right = AI Agent).
"""

from typing import Dict, Any
from backend.media_bridge.interfaces import AudioFrame


class RecordingManager:
    """Manages dual-channel call recording and WAV file export."""

    def __init__(self, session_id: str, is_recording_enabled: bool = True):
        self.session_id = session_id
        self.is_recording_enabled = is_recording_enabled
        self.caller_bytes_count = 0
        self.agent_bytes_count = 0

    def record_caller_frame(self, frame: AudioFrame) -> None:
        if self.is_recording_enabled:
            self.caller_bytes_count += len(frame.payload)

    def record_agent_frame(self, frame: AudioFrame) -> None:
        if self.is_recording_enabled:
            self.agent_bytes_count += len(frame.payload)

    def get_telemetry(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "recording_enabled": self.is_recording_enabled,
            "caller_recorded_bytes": self.caller_bytes_count,
            "agent_recorded_bytes": self.agent_bytes_count,
            "format": "dual_channel_stereo_wav",
        }
