"""
Behavior Engine Runtime Orchestrator
Nexus Call OS v2.4 Enterprise

Manages active behavior engine session instances across concurrent calls.
"""

from typing import Dict, Any, Optional
from backend.behavior_engine.behavior_engine import BehaviorEngine
from backend.behavior_engine.goal_manager import BusinessGoal


class BehaviorEngineRuntime:
    """Manages per-session BehaviorEngine instances for concurrent calls."""

    def __init__(self):
        self._sessions: Dict[str, BehaviorEngine] = {}

    def create_session(
        self,
        session_id: str,
        business_type: str = "general",
        strategy_override: str = "",
        primary_goal: str = "appointment_booking",
    ) -> Dict[str, Any]:
        try:
            goal = BusinessGoal(primary_goal)
        except ValueError:
            goal = BusinessGoal.APPOINTMENT_BOOKING

        engine = BehaviorEngine(
            session_id=session_id,
            business_type=business_type,
            strategy_override=strategy_override,
            primary_goal=goal,
        )
        self._sessions[session_id] = engine
        return {
            "status": "created",
            "session_id": session_id,
            "business_type": business_type,
            "strategy": engine.current_strategy,
        }

    def evaluate_turn(self, session_id: str, user_input: str, ai_response: Optional[str] = None) -> Dict[str, Any]:
        engine = self._sessions.get(session_id)
        if not engine:
            return {"error": "Session not found", "session_id": session_id}
        return engine.evaluate(user_input, ai_response)

    def close_session(self, session_id: str) -> Dict[str, Any]:
        engine = self._sessions.pop(session_id, None)
        return {"status": "closed", "session_id": session_id, "found": engine is not None}

    def get_telemetry(self) -> Dict[str, Any]:
        return {
            "subsystem": "Enterprise Behavior Engine",
            "status": "online",
            "active_sessions_count": len(self._sessions),
        }
