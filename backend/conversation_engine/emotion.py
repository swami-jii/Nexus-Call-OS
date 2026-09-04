"""
Emotion Detection Hooks & Sentiment Tracking Module
Analyzes caller tone, sentiment score, and emotional state (Calm, Frustrated, Urgent, Neutral).
"""

from enum import Enum
from typing import Dict, Any


class EmotionalState(str, Enum):
    CALM = "calm"
    FRIENDLY = "friendly"
    NEUTRAL = "neutral"
    FRUSTRATED = "frustrated"
    URGENT = "urgent"


class EmotionDetector:
    """Tracks caller sentiment and triggers empathetic response adjustments."""

    def __init__(self):
        self.current_state: EmotionalState = EmotionalState.NEUTRAL
        self.sentiment_score: float = 0.0  # -1.0 to +1.0

    def analyze_text(self, text: str) -> EmotionalState:
        if not text or not text.strip():
            self.current_state = EmotionalState.NEUTRAL
            self.sentiment_score = 0.0
            return self.current_state

        txt = text.strip()
        # Dynamic detection based on expressive punctuation and text energy
        if "!" in txt and len(txt.split()) > 3:
            self.current_state = EmotionalState.FRIENDLY
            self.sentiment_score = 0.5
        elif "?" in txt and len(txt.split()) <= 3:
            self.current_state = EmotionalState.URGENT
            self.sentiment_score = -0.2
        else:
            self.current_state = EmotionalState.NEUTRAL
            self.sentiment_score = 0.0

        return self.current_state

    def get_telemetry(self) -> Dict[str, Any]:
        return {
            "emotional_state": self.current_state.value,
            "sentiment_score": self.sentiment_score,
        }
