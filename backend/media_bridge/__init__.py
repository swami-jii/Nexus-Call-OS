"""
Live Media Bridge Subsystem
Nexus Call OS v2.4 Enterprise

High-throughput, low-latency real-time media layer processing 20ms audio frames.
Connects carrier streams with the Conversation Engine via VAD, AEC, noise suppression, and resamplers.
"""

from backend.media_bridge.audio_chunker import AudioChunker
from backend.media_bridge.audio_clock import AudioClock
from backend.media_bridge.audio_pipeline import AudioPipeline
from backend.media_bridge.audio_resampler import AudioResampler
from backend.media_bridge.bridge_runtime import LiveMediaBridgeRuntime
from backend.media_bridge.codec_converter import CodecConverter
from backend.media_bridge.echo_cancellation import AcousticEchoCanceller
from backend.media_bridge.interfaces import AudioFrame, IAudioProcessor, MediaCodec
from backend.media_bridge.latency_controller import LatencyController
from backend.media_bridge.noise_suppressor import NoiseSuppressor
from backend.media_bridge.playback_manager import PlaybackManager
from backend.media_bridge.recording_manager import RecordingManager
from backend.media_bridge.stream_manager import StreamManager
from backend.media_bridge.stream_synchronizer import StreamSynchronizer
from backend.media_bridge.vad_manager import VADManager

__all__ = [
    "LiveMediaBridgeRuntime",
    "AudioFrame",
    "MediaCodec",
    "IAudioProcessor",
    "AudioChunker",
    "AudioClock",
    "AudioResampler",
    "CodecConverter",
    "AcousticEchoCanceller",
    "NoiseSuppressor",
    "VADManager",
    "StreamSynchronizer",
    "LatencyController",
    "PlaybackManager",
    "RecordingManager",
    "StreamManager",
    "AudioPipeline",
]
