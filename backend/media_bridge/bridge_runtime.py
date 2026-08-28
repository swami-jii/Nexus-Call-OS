"""
Live Media Bridge Runtime Orchestrator
Nexus Call OS v2.4 Enterprise

Central orchestrator for the Live Media Bridge Subsystem.
Links stream manager, audio pipelines, latency controllers, playback managers, and recording managers.
"""

from typing import Dict, Any, List, Optional

from backend.media_bridge.audio_pipeline import AudioPipeline
from backend.media_bridge.interfaces import MediaCodec
from backend.media_bridge.latency_controller import LatencyController
from backend.media_bridge.playback_manager import PlaybackManager
from backend.media_bridge.recording_manager import RecordingManager
from backend.media_bridge.stream_manager import StreamManager
from backend.media_bridge.stream_synchronizer import StreamSynchronizer


class LiveMediaBridgeRuntime:
    """Central Live Media Bridge Runtime orchestrating low-latency audio transport."""

    def __init__(self):
        self.stream_manager = StreamManager()
        self.latency_controller = LatencyController()
        self._active_pipelines: Dict[str, AudioPipeline] = {}
        self._playback_managers: Dict[str, PlaybackManager] = {}
        self._recording_managers: Dict[str, RecordingManager] = {}
        self._synchronizers: Dict[str, StreamSynchronizer] = {}

    def create_bridge_session(
        self,
        session_id: str,
        codec: str = "pcm",
        sample_rate: int = 8000,
    ) -> Dict[str, Any]:
        """Create a new live media bridge streaming session."""
        codec_enum = MediaCodec.PCM
        if codec.lower() == "g711_mulaw":
            codec_enum = MediaCodec.G711_MULAW
        elif codec.lower() == "g711_alaw":
            codec_enum = MediaCodec.G711_ALAW
        elif codec.lower() == "opus":
            codec_enum = MediaCodec.OPUS
        elif codec.lower() == "linear16":
            codec_enum = MediaCodec.LINEAR16

        stream = self.stream_manager.create_stream(session_id, codec=codec_enum, sample_rate=sample_rate)
        pipeline = AudioPipeline(session_id, sample_rate=sample_rate, codec=codec_enum)
        playback = PlaybackManager()
        recording = RecordingManager(session_id)
        sync = StreamSynchronizer()

        self._active_pipelines[session_id] = pipeline
        self._playback_managers[session_id] = playback
        self._recording_managers[session_id] = recording
        self._synchronizers[session_id] = sync

        return {
            "status": "created",
            "session": stream.to_dict(),
            "telemetry": pipeline.get_telemetry(),
        }

    def process_inbound_stream_chunk(self, session_id: str, pcm_bytes: bytes) -> Dict[str, Any]:
        """Process incoming 20ms audio frame chunk from caller."""
        pipeline = self._active_pipelines.get(session_id)
        if not pipeline:
            return {"error": "Bridge session not found", "session_id": session_id}

        results = pipeline.process_inbound_chunk(pcm_bytes)
        return {
            "session_id": session_id,
            "frames_processed": len(results),
            "results": results,
            "pipeline_telemetry": pipeline.get_telemetry(),
        }

    def trigger_bargein_flush(self, session_id: str) -> Dict[str, Any]:
        """Flush playback buffer immediately on user barge-in."""
        playback = self._playback_managers.get(session_id)
        flushed = playback.flush_on_interruption() if playback else 0
        return {"status": "flushed", "session_id": session_id, "flushed_frames": flushed}

    def close_bridge_session(self, session_id: str) -> Dict[str, Any]:
        """Close bridge session and return recording telemetry."""
        self.stream_manager.close_stream(session_id)
        self._active_pipelines.pop(session_id, None)
        self._playback_managers.pop(session_id, None)
        rec = self._recording_managers.pop(session_id, None)
        self._synchronizers.pop(session_id, None)

        return {
            "status": "closed",
            "session_id": session_id,
            "recording_summary": rec.get_telemetry() if rec else None,
        }

    def get_telemetry(self) -> Dict[str, Any]:
        return {
            "bridge_status": "online",
            "active_streams_count": len(self.stream_manager.get_all_streams()),
            "active_streams": self.stream_manager.get_all_streams(),
            "latency": self.latency_controller.get_telemetry(),
        }
