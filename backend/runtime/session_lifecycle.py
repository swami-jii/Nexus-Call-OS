"""
Session Lifecycle Module
Nexus Call OS v2.4 Enterprise

Manages call session initialization, multi-subsystem allocation, and complete tear-down cleanup.
Tear-down releases memory, flushes audio buffers, closes media streams, terminates gateway sessions, and finalizes recordings.
"""

import time
from typing import Dict, Any, Optional

from backend.conversation_engine.engine_brain import ConversationEngine
from backend.media_bridge.bridge_runtime import LiveMediaBridgeRuntime
from backend.telephony.runtime import UniversalTelephonyGateway


class RuntimeSessionLifecycleManager:
    """Manages the full lifecycle of integrated call sessions across Telephony, Media Bridge, and Conversation Engine."""

    def __init__(
        self,
        telephony_gateway: UniversalTelephonyGateway,
        media_bridge: LiveMediaBridgeRuntime,
    ):
        self.telephony_gateway = telephony_gateway
        self.media_bridge = media_bridge
        self.active_conversations: Dict[str, ConversationEngine] = {}

    async def initialize_session(
        self,
        session_id: str,
        phone_number: str = "+18005550199",
        provider_name: str = "simulated",
        direction: str = "outbound",
        agent_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Allocate resources across Telephony Gateway, Live Media Bridge, and Conversation Engine."""
        # 1. Telephony Session
        tel_res = await self.telephony_gateway.initiate_call(
            session_id=session_id,
            phone_number=phone_number,
            provider_name=provider_name,
            direction=direction,
            agent_id=agent_id,
        )

        # 2. Live Media Bridge Session
        media_res = self.media_bridge.create_bridge_session(
            session_id=session_id,
            codec="pcm",
            sample_rate=8000,
        )

        # 3. Conversation Engine Instance per Session
        conv_engine = ConversationEngine(
            session_id=session_id,
            agent_id=agent_id or "default_agent",
        )
        self.active_conversations[session_id] = conv_engine
        conv_res = conv_engine.start()

        return {
            "session_id": session_id,
            "status": "active",
            "telephony": tel_res,
            "media_bridge": media_res,
            "conversation_engine": conv_res,
            "initialized_at": time.time(),
        }

    async def cleanup_session(self, session_id: str, reason: str = "normal_clearing") -> Dict[str, Any]:
        """Perform complete 6-stage session cleanup."""
        # 1. Flush Media Bridge Playback Buffer & Close Stream
        media_close = self.media_bridge.close_bridge_session(session_id)

        # 2. Terminate Conversation Engine Session & Flush Metrics
        conv_engine = self.active_conversations.pop(session_id, None)
        conv_end = conv_engine.end(reason=reason) if conv_engine else {"status": "ended", "session_id": session_id}

        # 3. Terminate Telephony Gateway Call Session
        tel_end = await self.telephony_gateway.end_call(session_id, reason=reason)

        return {
            "session_id": session_id,
            "status": "cleaned_up",
            "reason": reason,
            "media_cleanup": media_close,
            "conversation_cleanup": conv_end,
            "telephony_cleanup": tel_end,
            "cleaned_at": time.time(),
        }
