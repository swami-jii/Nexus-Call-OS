"""
Conversation State Machine Module
Controls the exact state transitions of real-time voice calls:
IDLE -> LISTENING -> THINKING -> SPEAKING -> (INTERRUPTED) -> TERMINATED.
"""

from enum import Enum
import time
from typing import Any, Callable, Dict, List, Optional


class ConversationState(str, Enum):
    IDLE = "idle"
    LISTENING = "listening"
    THINKING = "thinking"
    SPEAKING = "speaking"
    INTERRUPTED = "interrupted"
    TERMINATED = "terminated"


class StateTransitionEvent:
    def __init__(self, from_state: ConversationState, to_state: ConversationState, reason: str):
        self.from_state = from_state
        self.to_state = to_state
        self.reason = reason
        self.timestamp = time.time()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "from_state": self.from_state.value,
            "to_state": self.to_state.value,
            "reason": self.reason,
            "timestamp": self.timestamp,
        }


class ConversationStateMachine:
    """Manages call state transitions and triggers state observers."""

    def __init__(self, session_id: str):
        self.session_id = session_id
        self._current_state: ConversationState = ConversationState.IDLE
        self._history: List[StateTransitionEvent] = []
        self._listeners: List[Callable[[StateTransitionEvent], None]] = []
        self._state_started_at = time.time()

    @property
    def current_state(self) -> ConversationState:
        return self._current_state

    @property
    def time_in_current_state(self) -> float:
        return time.time() - self._state_started_at

    def register_listener(self, callback: Callable[[StateTransitionEvent], None]) -> None:
        self._listeners.append(callback)

    def transition_to(self, target_state: ConversationState, reason: str = "") -> bool:
        if self._current_state == ConversationState.TERMINATED:
            return False  # Cannot transition out of TERMINATED

        if self._current_state == target_state:
            return True

        event = StateTransitionEvent(
            from_state=self._current_state,
            to_state=target_state,
            reason=reason,
        )
        self._current_state = target_state
        self._state_started_at = time.time()
        self._history.append(event)

        for listener in self._listeners:
            try:
                listener(event)
            except Exception:
                pass

        return True

    def get_history(self) -> List[Dict[str, Any]]:
        return [evt.to_dict() for evt in self._history]
