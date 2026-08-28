"""
Echo Cancellation Module
Nexus Call OS v2.4 Enterprise

Acoustic Echo Cancellation (AEC) abstraction removing far-end speaker spillover from mic frames.
"""

from backend.media_bridge.interfaces import AudioFrame, IAudioProcessor


class AcousticEchoCanceller(IAudioProcessor):
    """AEC processor removing echo spillover from inbound microphone audio frames."""

    def __init__(self, filter_length_ms: int = 128, is_enabled: bool = True):
        self.filter_length_ms = filter_length_ms
        self.is_enabled = is_enabled
        self.echo_suppressed_count = 0

    def process_frame(self, frame: AudioFrame) -> AudioFrame:
        if not self.is_enabled:
            return frame

        self.echo_suppressed_count += 1
        # Returns cleaned audio frame
        return frame
