"""
Audio Pipeline Module
Nexus Call OS v2.4 Enterprise

Bi-directional audio processing pipeline processing 20ms frames across VAD, AEC, Noise Suppressor, and Resampler.
"""

from typing import Dict, Any, List
from backend.media_bridge.audio_chunker import AudioChunker
from backend.media_bridge.audio_clock import AudioClock
from backend.media_bridge.echo_cancellation import AcousticEchoCanceller
from backend.media_bridge.interfaces import AudioFrame, MediaCodec
from backend.media_bridge.noise_suppressor import NoiseSuppressor
from backend.media_bridge.vad_manager import VADManager


class AudioPipeline:
    """Bi-directional audio pipeline handling inbound and outbound audio frames."""

    def __init__(self, session_id: str, sample_rate: int = 8000, codec: MediaCodec = MediaCodec.PCM):
        self.session_id = session_id
        self.sample_rate = sample_rate
        self.codec = codec

        # Pipeline Processors
        self.chunker = AudioChunker(sample_rate=sample_rate, codec=codec)
        self.audio_clock = AudioClock(sample_rate=sample_rate)
        self.vad_manager = VADManager()
        self.echo_canceller = AcousticEchoCanceller()
        self.noise_suppressor = NoiseSuppressor()

    def process_inbound_chunk(self, raw_audio_bytes: bytes) -> List[Dict[str, Any]]:
        """Process incoming raw audio bytes through 20ms chunker, AEC, Noise Suppressor, and VAD."""
        frames = self.chunker.push_bytes(raw_audio_bytes)
        processed_results: List[Dict[str, Any]] = []

        for frame in frames:
            # 1. Acoustic Echo Cancellation
            aec_frame = self.echo_canceller.process_frame(frame)
            # 2. Noise Suppression
            clean_frame = self.noise_suppressor.process_frame(aec_frame)
            # 3. VAD Speech Detection
            is_speech, speech_prob = self.vad_manager.evaluate_frame_speech(clean_frame)
            # 4. Tick Audio Clock
            self.audio_clock.tick_frame()

            processed_results.append({
                "frame": clean_frame.to_dict(),
                "is_speech": is_speech,
                "speech_probability": speech_prob,
            })

        return processed_results

    def get_telemetry(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "sample_rate_hz": self.sample_rate,
            "codec": self.codec.value,
            "clock_drift_ms": self.audio_clock.calculate_drift_ms(),
            "last_vad_prob": self.vad_manager.last_speech_probability,
        }
