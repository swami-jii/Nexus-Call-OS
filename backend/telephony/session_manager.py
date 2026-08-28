"""
Session Manager Module
Nexus Call OS v2.4 Enterprise

Global telephony session registry and call lifecycle manager.
"""

from typing import Dict, List, Optional
from backend.telephony.call_session import CallSession
from backend.telephony.interfaces import TelephonyDirection, TelephonyCallStatus


class SessionManager:
    """Manages all active and historical call sessions."""

    def __init__(self):
        self._active_sessions: Dict[str, CallSession] = {}
        self._history_sessions: List[CallSession] = []

    def create_session(
        self,
        session_id: str,
        direction: TelephonyDirection,
        provider_name: str,
        agent_id: Optional[str] = None,
        phone_number: str = "+1234567890",
    ) -> CallSession:
        session = CallSession(
            session_id=session_id,
            direction=direction,
            provider_name=provider_name,
            agent_id=agent_id,
            phone_number=phone_number,
        )
        self._active_sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[CallSession]:
        return self._active_sessions.get(session_id)

    def terminate_session(self, session_id: str, reason_status: TelephonyCallStatus = TelephonyCallStatus.COMPLETED) -> Optional[CallSession]:
        session = self._active_sessions.pop(session_id, None)
        if session:
            session.mark_ended(reason_status)
            self._history_sessions.append(session)
        return session

    def get_active_sessions_count(self) -> int:
        return len(self._active_sessions)

    def get_all_active_sessions(self) -> List[Dict]:
        return [s.to_dict() for s in self._active_sessions.values()]
