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
    """Tracks emotion and adapts speech speed pacing (0.8x to 1.3x)."""

    POSITIVE_KEYWORDS = [
        "thank", "thanks", "great", "awesome", "perfect", "good", "helpful", "amazing",
        "love", "excellent", "wonderful", "appreciate", "shukriya", "dhanyawad",
        "badiya", "achha", "bahut achha", "shandar", "sahi hai"
    ]
    FRUSTRATED_KEYWORDS = [
        "angry", "terrible", "worst", "bad", "useless", "ridiculous", "hate", "scam",
        "horrible", "annoying", "waste", "cheat", "gussa", "bekaar", "bakwaas",
        "pareshan", "faltu", "problem", "kharaab", "dhoka", "disappointed"
    ]
    URGENT_KEYWORDS = [
        "urgent", "emergency", "immediately", "asap", "quick", "fast", "right now",
        "jaldi", "turant", "abhi", "critical", "hurry", "fast please"
    ]
    CALM_KEYWORDS = [
        "calm", "relax", "take your time", "no problem", "sure", "alright", "okay",
        "shanti", "koi baat nahi", "thik hai", "aram se"
    ]

    def __init__(self):
        self.current_state: EmotionalState = EmotionalState.NEUTRAL
        self.sentiment_score: float = 0.0  # -1.0 to +1.0
        self.speech_speed: float = 1.0     # 1.0 = normal

    def update_sentiment(self, text: str) -> EmotionalState:
        if not text or not text.strip():
            self.current_state = EmotionalState.NEUTRAL
            self.sentiment_score = 0.0
            self.speech_speed = 1.0
            return self.current_state

        txt_lower = text.strip().lower()

        # Check keyword matches
        is_pos = any(kw in txt_lower for kw in self.POSITIVE_KEYWORDS)
        is_frustrated = any(kw in txt_lower for kw in self.FRUSTRATED_KEYWORDS)
        is_urgent = any(kw in txt_lower for kw in self.URGENT_KEYWORDS)
        is_calm = any(kw in txt_lower for kw in self.CALM_KEYWORDS)

        if is_frustrated:
            self.current_state = EmotionalState.FRUSTRATED
            self.sentiment_score = -0.75
            self.speech_speed = 0.9  # Slower, calm, reassuring pacing
        elif is_urgent:
            self.current_state = EmotionalState.URGENT
            self.sentiment_score = -0.25
            self.speech_speed = 1.15  # Faster, prompt pacing
        elif is_pos:
            self.current_state = EmotionalState.FRIENDLY
            self.sentiment_score = 0.8
            self.speech_speed = 1.05
        elif is_calm:
            self.current_state = EmotionalState.CALM
            self.sentiment_score = 0.4
            self.speech_speed = 0.95
        elif "!" in text:
            self.current_state = EmotionalState.FRIENDLY
            self.sentiment_score = 0.35
            self.speech_speed = 1.0
        elif "?" in text and len(text.split()) <= 4:
            self.current_state = EmotionalState.URGENT
            self.sentiment_score = -0.1
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
