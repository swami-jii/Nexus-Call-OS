"""
Stream Manager Module
Nexus Call OS v2.4 Enterprise

Session registry for active bi-directional media streams.
"""

from typing import Dict, List, Optional
from backend.media_bridge.interfaces import MediaCodec


class MediaStreamSession:
    """Represents an active media stream session."""

    def __init__(self, session_id: str, codec: MediaCodec = MediaCodec.PCM, sample_rate: int = 8000):
        self.session_id = session_id
        self.codec = codec
        self.sample_rate = sample_rate
        self.frames_processed = 0

    def to_dict(self) -> Dict:
        return {
            "session_id": self.session_id,
            "codec": self.codec.value,
            "sample_rate": self.sample_rate,
            "frames_processed": self.frames_processed,
        }


class StreamManager:
    """Registry managing media stream sessions."""

    def __init__(self):
        self._active_streams: Dict[str, MediaStreamSession] = {}

    def create_stream(self, session_id: str, codec: MediaCodec = MediaCodec.PCM, sample_rate: int = 8000) -> MediaStreamSession:
        stream = MediaStreamSession(session_id, codec, sample_rate)
        self._active_streams[session_id] = stream
        return stream

    def get_stream(self, session_id: str) -> Optional[MediaStreamSession]:
        return self._active_streams.get(session_id)

    def close_stream(self, session_id: str) -> Optional[MediaStreamSession]:
        return self._active_streams.pop(session_id, None)

    def get_all_streams(self) -> List[Dict]:
        return [s.to_dict() for s in self._active_streams.values()]
