"""
Universal Telephony Gateway Runtime Orchestrator
Nexus Call OS v2.4 Enterprise

The central orchestrator for the Telephony Gateway.
Links session manager, call router, provider adapters, event dispatcher, and audio pipelines.
"""

from typing import Dict, Any, List, Optional

from backend.telephony.call_router import CallRouter
from backend.telephony.codec_manager import TelephonyCodec
from backend.telephony.event_dispatcher import TelephonyEventDispatcher
from backend.telephony.interfaces import ITelephonyProvider, TelephonyDirection, TelephonyCallStatus
from backend.telephony.provider_manager import ProviderManager
from backend.telephony.provider_registry import TelephonyProviderRegistry, TelephonyProviderType
from backend.telephony.session_manager import SessionManager, CallSession
from backend.telephony.telephony_events import TelephonyEvent, TelephonyEventType


class UniversalTelephonyGateway:
    """Universal Telephony Gateway orchestrating all phone calls across carrier providers."""

    def __init__(self):
        self.session_manager = SessionManager()
        self.call_router = CallRouter(self.session_manager)
        self.event_dispatcher = TelephonyEventDispatcher()
        self._active_adapters: Dict[str, ITelephonyProvider] = {}

    async def initiate_call(
        self,
        session_id: str,
        phone_number: str,
        provider_name: str = "simulated",
        direction: str = "outbound",
        agent_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Initiate an inbound or outbound call through the gateway."""
        dir_enum = TelephonyDirection.OUTBOUND if direction == "outbound" else TelephonyDirection.INBOUND
        session = self.session_manager.create_session(
            session_id=session_id,
            direction=dir_enum,
            provider_name=provider_name,
            agent_id=agent_id,
            phone_number=phone_number,
        )

        adapter = ProviderManager.create_adapter(session_id, provider_name)
        self._active_adapters[session_id] = adapter

        await adapter.connect({"phone_number": phone_number})
        session.mark_answered()

        # Publish Event
        evt_type = TelephonyEventType.OUTGOING_CALL if dir_enum == TelephonyDirection.OUTBOUND else TelephonyEventType.INCOMING_CALL
        self.event_dispatcher.publish(
            TelephonyEvent(
                event_type=evt_type,
                session_id=session_id,
                provider_name=provider_name,
                payload=session.to_dict(),
            )
        )

        return {
            "status": "initiated",
            "session": session.to_dict(),
            "telemetry": session.metrics.get_telemetry(),
        }

    async def send_dtmf_digit(self, session_id: str, digits: str) -> Dict[str, Any]:
        """Send DTMF touch tones over call session."""
        adapter = self._active_adapters.get(session_id)
        if not adapter:
            return {"error": "Session not found", "session_id": session_id}
        await adapter.send_dtmf(digits)
        self.event_dispatcher.publish(
            TelephonyEvent(
                event_type=TelephonyEventType.DTMF,
                session_id=session_id,
                provider_name=adapter.provider_name,
                payload={"digits": digits},
            )
        )
        return {"status": "success", "session_id": session_id, "dtmf": digits}

    async def hold_call(self, session_id: str) -> Dict[str, Any]:
        adapter = self._active_adapters.get(session_id)
        if adapter:
            await adapter.hold()
            self.event_dispatcher.publish(
                TelephonyEvent(
                    event_type=TelephonyEventType.HOLD,
                    session_id=session_id,
                    provider_name=adapter.provider_name,
                )
            )
        return {"status": "held", "session_id": session_id}

    async def resume_call(self, session_id: str) -> Dict[str, Any]:
        adapter = self._active_adapters.get(session_id)
        if adapter:
            await adapter.resume()
            self.event_dispatcher.publish(
                TelephonyEvent(
                    event_type=TelephonyEventType.RESUME,
                    session_id=session_id,
                    provider_name=adapter.provider_name,
                )
            )
        return {"status": "resumed", "session_id": session_id}

    async def transfer_call(self, session_id: str, target_number: str) -> Dict[str, Any]:
        adapter = self._active_adapters.get(session_id)
        if adapter:
            await adapter.transfer(target_number)
            self.event_dispatcher.publish(
                TelephonyEvent(
                    event_type=TelephonyEventType.TRANSFER,
                    session_id=session_id,
                    provider_name=adapter.provider_name,
                    payload={"target_number": target_number},
                )
            )
        return {"status": "transferred", "session_id": session_id, "target_number": target_number}

    async def end_call(self, session_id: str, reason: str = "normal_clearing") -> Dict[str, Any]:
        """Hang up and terminate call session."""
        adapter = self._active_adapters.pop(session_id, None)
        if adapter:
            await adapter.hangup(reason)

        session = self.session_manager.terminate_session(session_id, TelephonyCallStatus.COMPLETED)
        self.event_dispatcher.publish(
            TelephonyEvent(
                event_type=TelephonyEventType.CALL_ENDED,
                session_id=session_id,
                provider_name=adapter.provider_name if adapter else "simulated",
                payload={"reason": reason},
            )
        )
        return {
            "status": "ended",
            "session_id": session_id,
            "session": session.to_dict() if session else None,
        }

    def get_telemetry(self) -> Dict[str, Any]:
        return {
            "gateway_status": "online",
            "active_calls_count": self.session_manager.get_active_sessions_count(),
            "active_sessions": self.session_manager.get_all_active_sessions(),
            "supported_providers": TelephonyProviderRegistry.get_all_providers(),
        }
