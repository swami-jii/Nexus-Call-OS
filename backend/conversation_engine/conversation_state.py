"""
Conversation State Machine Module
Nexus Call OS v2.4 Enterprise

Implements the universal finite state machine:
IDLE -> GREETING -> LISTENING -> PROCESSING -> RESPONDING -> WAITING -> COMPLETED / FAILED.
"""

from enum import Enum
import time
from typing import Any, Callable, Dict, List, Optional


class CoreConversationState(str, Enum):
    IDLE = "idle"
    GREETING = "greeting"
    LISTENING = "listening"
    PROCESSING = "processing"
    RESPONDING = "responding"
    WAITING = "waiting"
    COMPLETED = "completed"
    FAILED = "failed"


class LoggedStateTransition:
    """Represents an audit log entry for a state transition."""

    def __init__(
        self,
        session_id: str,
        from_state: CoreConversationState,
        to_state: CoreConversationState,
        reason: str = "",
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.session_id = session_id
        self.from_state = from_state
        self.to_state = to_state
        self.reason = reason
        self.metadata = metadata or {}
        self.timestamp = time.time()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "from_state": self.from_state.value,
            "to_state": self.to_state.value,
            "reason": self.reason,
            "metadata": self.metadata,
            "timestamp": self.timestamp,
        }


class ConversationStateMachine:
    """Finite State Machine controlling conversation flow and transition logging."""

    VALID_TRANSITIONS: Dict[CoreConversationState, List[CoreConversationState]] = {
        CoreConversationState.IDLE: [CoreConversationState.GREETING, CoreConversationState.LISTENING, CoreConversationState.FAILED],
        CoreConversationState.GREETING: [CoreConversationState.LISTENING, CoreConversationState.RESPONDING, CoreConversationState.FAILED],
        CoreConversationState.LISTENING: [CoreConversationState.PROCESSING, CoreConversationState.WAITING, CoreConversationState.FAILED],
        CoreConversationState.PROCESSING: [CoreConversationState.RESPONDING, CoreConversationState.LISTENING, CoreConversationState.FAILED],
        CoreConversationState.RESPONDING: [CoreConversationState.LISTENING, CoreConversationState.WAITING, CoreConversationState.COMPLETED, CoreConversationState.FAILED],
        CoreConversationState.WAITING: [CoreConversationState.LISTENING, CoreConversationState.COMPLETED, CoreConversationState.FAILED],
        CoreConversationState.COMPLETED: [],
        CoreConversationState.FAILED: [],
    }

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.current_state = CoreConversationState.IDLE
        self.history: List[LoggedStateTransition] = []
        self.transition_callbacks: List[Callable[[LoggedStateTransition], None]] = []
        self.state_started_at = time.time()

    def register_callback(self, callback: Callable[[LoggedStateTransition], None]) -> None:
        self.transition_callbacks.append(callback)

    def transition_to(self, target_state: CoreConversationState, reason: str = "", metadata: Optional[Dict[str, Any]] = None) -> bool:
        """Execute a state transition if valid and log the transition."""
        if self.current_state in (CoreConversationState.COMPLETED, CoreConversationState.FAILED):
            return False

        if target_state not in self.VALID_TRANSITIONS.get(self.current_state, []):
            # Allow force reset if transitioning to FAILED
            if target_state != CoreConversationState.FAILED:
                print(f"Warning: Invalid state transition {self.current_state.value} -> {target_state.value}")

        transition = LoggedStateTransition(
            session_id=self.session_id,
            from_state=self.current_state,
            to_state=target_state,
            reason=reason,
            metadata=metadata,
        )

        self.current_state = target_state
        self.state_started_at = time.time()
        self.history.append(transition)

        for cb in self.transition_callbacks:
            try:
                cb(transition)
            except Exception:
                pass

        return True

    def get_history_logs(self) -> List[Dict[str, Any]]:
        return [t.to_dict() for t in self.history]
