"""
Call Router Module
Nexus Call OS v2.4 Enterprise

Routes incoming and outgoing calls to appropriate agents, phone profiles, and telephony providers.
Strictly resolves per-number configuration profiles from the database and Android Device Registry.
"""

from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.telephony.interfaces import TelephonyDirection
from backend.telephony.session_manager import SessionManager, CallSession
from backend.models.models import PhoneNumber
from backend.android_gateway.device_registry import DeviceRegistry

_device_registry = DeviceRegistry()


class CallRouter:
    """Routes inbound DID calls and outbound campaign calls based on Phone Profiles."""

    def __init__(self, session_manager: SessionManager):
        self.session_manager = session_manager
        self._dids_route_table: Dict[str, str] = {}  # DID -> Agent ID

    def bind_did_to_agent(self, phone_number: str, agent_id: str) -> None:
        self._dids_route_table[phone_number] = agent_id

    def resolve_phone_profile(self, phone_number: str, db: Optional[Session] = None) -> Dict[str, Any]:
        """Resolves assigned agent, provider, and settings for a given phone number."""
        profile: Dict[str, Any] = {
            "phone_number": phone_number,
            "agent_id": self._dids_route_table.get(phone_number, "default_agent"),
            "llm_provider": "google",
            "voice_engine": "piper",
            "business_type": "general",
        }

        # Check DB PhoneNumber table if session passed
        if db:
            db_phone = db.query(PhoneNumber).filter(PhoneNumber.number == phone_number).first()
            if db_phone and db_phone.assigned_agent_id:
                profile["agent_id"] = db_phone.assigned_agent_id
                profile["provider"] = db_phone.provider

        # Check Android Device Registry
        devices = _device_registry.list_devices()
        for dev in devices:
            if dev.get("sim_number") == phone_number:
                profile["device_id"] = dev.get("device_id")
                profile["auto_answer"] = dev.get("auto_answer", True)
                break

        return profile

    def route_inbound_call(
        self,
        session_id: str,
        phone_number: str,
        provider_name: str,
        db: Optional[Session] = None,
    ) -> CallSession:
        """Routes inbound call using assigned Phone Profile."""
        profile = self.resolve_phone_profile(phone_number, db=db)
        return self.session_manager.create_session(
            session_id=session_id,
            direction=TelephonyDirection.INBOUND,
            provider_name=provider_name,
            agent_id=profile["agent_id"],
            phone_number=phone_number,
        )

    def route_outbound_call(
        self,
        session_id: str,
        destination_number: str,
        provider_name: str,
        agent_id: str,
    ) -> CallSession:
        """Routes outbound call."""
        return self.session_manager.create_session(
            session_id=session_id,
            direction=TelephonyDirection.OUTBOUND,
            provider_name=provider_name,
            agent_id=agent_id,
            phone_number=destination_number,
        )
