"""
VAD Manager Module
Nexus Call OS v2.4 Enterprise

Voice Activity Detection (VAD) processor scoring speech probability (0.0 - 1.0) on 20ms frames.
"""

from typing import Tuple
from backend.media_bridge.interfaces import AudioFrame, IAudioProcessor


class VADManager(IAudioProcessor):
    """VAD processor classifying human speech vs. background silence."""

    def __init__(self, speech_threshold: float = 0.5):
        self.speech_threshold = speech_threshold
        self.last_speech_probability = 0.0

    def evaluate_frame_speech(self, frame: AudioFrame) -> Tuple[bool, float]:
        """Calculates speech probability score for a 20ms audio frame."""
        if not frame.payload or len(frame.payload) == 0:
            self.last_speech_probability = 0.0
            return False, 0.0

        # Simple energy calculation on 16-bit PCM frames
        total_energy = sum(abs(int.from_bytes(frame.payload[i:i+2], byteorder='little', signed=True))
                           for i in range(0, len(frame.payload), 2))
        avg_energy = total_energy / max(1, len(frame.payload) // 2)

        # Normalize probability score
        prob = min(1.0, avg_energy / 1500.0)
        self.last_speech_probability = prob
        is_speech = prob >= self.speech_threshold

        return is_speech, round(prob, 2)

    def process_frame(self, frame: AudioFrame) -> AudioFrame:
        self.evaluate_frame_speech(frame)
        return frame
