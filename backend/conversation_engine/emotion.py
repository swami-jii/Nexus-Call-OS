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

    FRUSTRATION_KEYWORDS = ["angry", "upset", "cancel", "supervisor", "manager", "terrible", "waste", "human"]
    URGENT_KEYWORDS = ["emergency", "immediately", "urgent", "asap", "now", "critical"]

    def __init__(self):
        self.current_state: EmotionalState = EmotionalState.NEUTRAL
        self.sentiment_score: float = 0.0  # -1.0 to +1.0

    def analyze_text(self, text: str) -> EmotionalState:
        text_lower = text.lower()
        if any(kw in text_lower for kw in self.FRUSTRATION_KEYWORDS):
            self.current_state = EmotionalState.FRUSTRATED
            self.sentiment_score = -0.8
        elif any(kw in text_lower for kw in self.URGENT_KEYWORDS):
            self.current_state = EmotionalState.URGENT
            self.sentiment_score = -0.3
        elif any(kw in text_lower for kw in ["thanks", "thank you", "great", "awesome", "good"]):
            self.current_state = EmotionalState.FRIENDLY
            self.sentiment_score = 0.8
        else:
            self.current_state = EmotionalState.NEUTRAL
            self.sentiment_score = 0.0

        return self.current_state

    def get_telemetry(self) -> Dict[str, Any]:
        return {
            "emotional_state": self.current_state.value,
            "sentiment_score": self.sentiment_score,
        }
