"""
Memory Selector Module
Nexus Call OS v2.4 Enterprise

Retrieves relevant past conversation turns and customer context from session memory.
"""

from typing import Dict, Any, List


class MemoryTurn:
    def __init__(self, speaker: str, text: str):
        self.speaker = speaker
        self.text = text


class MemorySelector:
    """Retrieves relevant past turns and session context for the Behavior Engine decision layer."""

    def __init__(self):
        self._turns: List[MemoryTurn] = []

    def add_turn(self, speaker: str, text: str) -> None:
        self._turns.append(MemoryTurn(speaker=speaker, text=text))

    def get_recent_turns(self, n: int = 5) -> List[Dict[str, str]]:
        recent = self._turns[-n:]
        return [{"speaker": t.speaker, "text": t.text} for t in recent]

    def retrieve_context_summary(self) -> Dict[str, Any]:
        return {
            "total_turns": len(self._turns),
            "recent_turns": self.get_recent_turns(5),
            "user_name_mentioned": self._extract_name_from_turns(),
        }

    def _extract_name_from_turns(self) -> str:
        for turn in reversed(self._turns):
            words = turn.text.split()
            if len(words) >= 2 and turn.speaker == "user":
                return words[-1].capitalize()
        return "Caller"
