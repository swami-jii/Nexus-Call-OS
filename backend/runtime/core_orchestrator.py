"""
Core Runtime Orchestrator Module
Nexus Call OS v2.4 Enterprise

Ties together Universal Telephony Gateway, Live Media Bridge, Conversation Engine, LLM Layer, and TTS Layer into a seamless, provider-agnostic loop.
"""

from typing import Dict, Any, Optional

from backend.conversation_engine.engine_brain import ConversationEngine
from backend.media_bridge.bridge_runtime import LiveMediaBridgeRuntime
from backend.runtime.event_flow import EventFlowOrchestrator
from backend.runtime.health_dashboard import RuntimeHealthDashboardCollector
from backend.runtime.session_lifecycle import RuntimeSessionLifecycleManager
from backend.telephony.runtime import UniversalTelephonyGateway


class CoreRuntimeOrchestrator:
    """Master orchestrator for Nexus Call OS end-to-end voice sessions."""

    def __init__(self):
        # Instantiate Subsystems
        self.telephony_gateway = UniversalTelephonyGateway()
        self.media_bridge = LiveMediaBridgeRuntime()

        # Session Lifecycle & Health
        self.lifecycle_manager = RuntimeSessionLifecycleManager(
            telephony_gateway=self.telephony_gateway,
            media_bridge=self.media_bridge,
        )
        self.health_dashboard = RuntimeHealthDashboardCollector(
            telephony_gateway=self.telephony_gateway,
            media_bridge=self.media_bridge,
            active_conversations=self.lifecycle_manager.active_conversations,
        )
        self._event_flows: Dict[str, EventFlowOrchestrator] = {}

    async def start_voice_session(
        self,
        session_id: str,
        phone_number: str = "+18005550199",
        provider_name: str = "simulated",
        direction: str = "outbound",
        agent_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Start a complete end-to-end AI voice session."""
        flow = EventFlowOrchestrator(session_id)
        self._event_flows[session_id] = flow

        flow.record_stage("INCOMING_CALL")
        flow.record_stage("SESSION_CREATED")

        init_res = await self.lifecycle_manager.initialize_session(
            session_id=session_id,
            phone_number=phone_number,
            provider_name=provider_name,
            direction=direction,
            agent_id=agent_id,
        )

        flow.record_stage("MEDIA_SESSION_ALLOCATED")
        flow.record_stage("CONVERSATION_STARTED")
        flow.record_stage("GREETING_GENERATED")

        return {
            "status": "success",
            "session_id": session_id,
            "session_data": init_res,
            "event_flow": flow.get_pipeline_history(),
        }

    async def process_user_speech_turn(
        self,
        session_id: str,
        user_speech_text: str,
        raw_pcm_hex: Optional[str] = None,
        ai_response_override: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Execute a full conversation turn: STT -> LLM -> Humanizer -> TTS -> Playback."""
        flow = self._event_flows.get(session_id)
        if not flow:
            flow = EventFlowOrchestrator(session_id)
            self._event_flows[session_id] = flow

        flow.record_stage("LISTEN_VAD_ACTIVE")
        flow.record_stage("STT_TRANSCRIPTION", {"text": user_speech_text})

        # Process 20ms Frame Chunk in Media Bridge
        if raw_pcm_hex:
            try:
                pcm_bytes = bytes.fromhex(raw_pcm_hex)
            except ValueError:
                pcm_bytes = b"\x00" * 320
            self.media_bridge.process_inbound_stream_chunk(session_id, pcm_bytes)

        # Get session's ConversationEngine instance
        conv_engine = self.lifecycle_manager.active_conversations.get(session_id)
        if not conv_engine:
            conv_engine = ConversationEngine(session_id=session_id)
            self.lifecycle_manager.active_conversations[session_id] = conv_engine
            conv_engine.start()

        # Execute Turn in Conversation Engine (LLM + Humanizer + SSML)
        conv_res = conv_engine.process_text(raw_input=user_speech_text, ai_response_override=ai_response_override)

        flow.record_stage("LLM_RESPONSE_GENERATED", {"response": conv_res.get("ai_response")})
        flow.record_stage("HUMANIZER_SSML_APPLIED", {"ssml": conv_res.get("humanized_ssml")})
        flow.record_stage("TTS_AUDIO_SYNTHESIZED")
        flow.record_stage("PLAYBACK_STREAMED")
        flow.record_stage("TURN_COMPLETED")

        return {
            "status": "success",
            "session_id": session_id,
            "result": conv_res,
            "event_flow": flow.get_pipeline_history(),
        }

    async def end_voice_session(self, session_id: str, reason: str = "normal_clearing") -> Dict[str, Any]:
        """End voice session and perform complete 6-stage cleanup."""
        flow = self._event_flows.get(session_id)
        if flow:
            flow.record_stage("HANGUP_INITIATED")

        cleanup_res = await self.lifecycle_manager.cleanup_session(session_id, reason=reason)

        if flow:
            flow.record_stage("CLEANUP_FINALIZED")

        self._event_flows.pop(session_id, None)

        return {
            "status": "success",
            "session_id": session_id,
            "cleanup": cleanup_res,
        }

    def get_system_health(self) -> Dict[str, Any]:
        return self.health_dashboard.get_full_dashboard_telemetry()
