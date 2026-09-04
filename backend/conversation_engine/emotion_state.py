"""
Emotion State Module
Nexus Call OS v2.4 Enterprise

Tracks caller emotional state, sentiment score, and calculates optimal speech speed modulation.
"""

from enum import Enum
from typing import Dict, Any


class EmotionalState(str, Enum):
    CALM = "calm"
    FRIENDLY = "friendly"
    NEUTRAL = "neutral"
    FRUSTRATED = "frustrated"
    URGENT = "urgent"


class EmotionTracker:
    """Tracks emotion and adapts speech speed pacing (0.8x to 1.2x)."""

    def __init__(self):
        self.current_state = EmotionalState.NEUTRAL
        self.sentiment_score = 0.0  # -1.0 to +1.0
        self.speech_speed = 1.0     # 1.0 = normal

    def update_sentiment(self, text: str) -> EmotionalState:
        if not text or not text.strip():
            self.current_state = EmotionalState.NEUTRAL
            self.sentiment_score = 0.0
            self.speech_speed = 1.0
            return self.current_state

        txt = text.strip()
        if "!" in txt and len(txt.split()) > 3:
            self.current_state = EmotionalState.FRIENDLY
            self.sentiment_score = 0.5
            self.speech_speed = 1.0
        elif "?" in txt and len(txt.split()) <= 3:
            self.current_state = EmotionalState.URGENT
            self.sentiment_score = -0.2
            self.speech_speed = 1.05
        else:
            self.current_state = EmotionalState.NEUTRAL
            self.sentiment_score = 0.0
            self.speech_speed = 1.0

        return self.current_state

    def get_telemetry(self) -> Dict[str, Any]:
        return {
            "emotional_state": self.current_state.value,
            "sentiment_score": self.sentiment_score,
            "recommended_speech_speed": self.speech_speed,
        }
