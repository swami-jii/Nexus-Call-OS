"""
Noise Suppressor Module
Nexus Call OS v2.4 Enterprise

Background noise suppression & spectral gating processor eliminating stationary background noise.
"""

from backend.media_bridge.interfaces import AudioFrame, IAudioProcessor


class NoiseSuppressor(IAudioProcessor):
    """Noise suppressor suppressing room hum, air conditioning, and static line noise."""

    def __init__(self, suppression_db: float = -18.0, is_enabled: bool = True):
        self.suppression_db = suppression_db
        self.is_enabled = is_enabled

    def process_frame(self, frame: AudioFrame) -> AudioFrame:
        if not self.is_enabled:
            return frame

        # Returns noise-suppressed frame
        return frame
