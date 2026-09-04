"""
Context Manager Module
Nexus Call OS v2.4 Enterprise

Manages short-term and long-term conversation memory and performs language detection.
"""

import re
from typing import Dict, Any, List


class ContextManager:
    """Manages turn memory context and primary language detection."""

    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self.short_term_memory: List[Dict[str, str]] = []
        self.detected_language = "en-US"

    def add_turn(self, speaker: str, text: str) -> None:
        self.short_term_memory.append({"speaker": speaker, "text": text})

        # Automatic language detection on user turn via script analysis
        if speaker == "user" and text:
            if re.search(r'[\u0900-\u097F]', text):
                self.detected_language = "hi-IN"
            elif re.search(r'[\u0600-\u06FF]', text):
                self.detected_language = "ar-SA"
            elif re.search(r'[\u0400-\u04FF]', text):
                self.detected_language = "ru-RU"
            elif re.search(r'[\u3040-\u30FF\u4E00-\u9FFF]', text):
                self.detected_language = "ja-JP"

    def get_conversation_history(self) -> List[Dict[str, str]]:
        return self.short_term_memory

    def get_telemetry(self) -> Dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "turns_count": len(self.short_term_memory),
            "detected_language": self.detected_language,
        }
