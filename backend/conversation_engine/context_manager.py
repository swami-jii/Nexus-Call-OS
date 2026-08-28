"""
Context Manager Module
Nexus Call OS v2.4 Enterprise

Manages short-term and long-term conversation memory and performs language detection.
"""

from typing import Dict, Any, List


class ContextManager:
    """Manages turn memory context and primary language detection."""

    HINDI_KEYWORDS = ["namaste", "kaise", "aap", "mera", "naam", "madad", "kya", "hai", "shukriya"]
    SPANISH_KEYWORDS = ["hola", "como", "gracias", "por favor", "buenos", "dias", "que", "esta"]

    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self.short_term_memory: List[Dict[str, str]] = []
        self.detected_language = "en-US"

    def add_turn(self, speaker: str, text: str) -> None:
        self.short_term_memory.append({"speaker": speaker, "text": text})

        # Automatic language detection on user turn
        if speaker == "user":
            text_lower = text.lower()
            if any(w in text_lower for w in self.HINDI_KEYWORDS):
                self.detected_language = "hi-IN"
            elif any(w in text_lower for w in self.SPANISH_KEYWORDS):
                self.detected_language = "es-ES"

    def get_conversation_history(self) -> List[Dict[str, str]]:
        return self.short_term_memory

    def get_telemetry(self) -> Dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "turns_count": len(self.short_term_memory),
            "detected_language": self.detected_language,
        }
