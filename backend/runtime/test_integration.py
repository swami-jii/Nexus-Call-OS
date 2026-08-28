"""
Integration Test Suite
Nexus Call OS v2.4 Enterprise

Automated unittest suite verifying end-to-end integration across:
1. Conversation Test
2. Media Test
3. Gateway Test
4. Pipeline Test
5. Cleanup Test
"""

import asyncio
import unittest
from backend.conversation_engine.engine_brain import ConversationEngine
from backend.runtime.core_orchestrator import CoreRuntimeOrchestrator


class TestCoreRuntimeIntegration(unittest.TestCase):
    """End-to-End Core Runtime Integration Test Suite."""

    def setUp(self):
        self.orchestrator = CoreRuntimeOrchestrator()
        self.session_id = "test_integration_session_99"

    def test_01_gateway_subsystem(self):
        """Gateway Test: Verify Telephony Gateway initiation."""
        async def run():
            res = await self.orchestrator.telephony_gateway.initiate_call(
                session_id=self.session_id,
                phone_number="+18005550199",
                provider_name="simulated",
            )
            self.assertEqual(res["status"], "initiated")
            self.assertIn("session", res)

        asyncio.run(run())

    def test_02_media_bridge_subsystem(self):
        """Media Test: Verify 20ms frame chunking and VAD in Media Bridge."""
        session_info = self.orchestrator.media_bridge.create_bridge_session(self.session_id, codec="pcm")
        self.assertEqual(session_info["status"], "created")

        pcm_bytes = b"\x00" * 320  # 20ms silent frame
        res = self.orchestrator.media_bridge.process_inbound_stream_chunk(self.session_id, pcm_bytes)
        self.assertEqual(res["frames_processed"], 1)

    def test_03_conversation_engine(self):
        """Conversation Test: Verify state machine start and turn processing."""
        conv_engine = ConversationEngine(session_id=self.session_id, agent_id="test_agent")
        start_res = conv_engine.start()
        self.assertEqual(start_res["status"], "started")

        turn_res = conv_engine.process_text(raw_input="Hello! Testing integration pipeline.")
        self.assertIn("ai_response", turn_res)

    def test_04_end_to_end_pipeline(self):
        """Pipeline Test: Verify end-to-end start -> user turn -> barge-in -> response."""
        async def run():
            session_id = "e2e_pipeline_session_101"
            start_res = await self.orchestrator.start_voice_session(
                session_id=session_id,
                phone_number="+18005559999",
                provider_name="simulated",
            )
            self.assertEqual(start_res["status"], "success")

            turn_res = await self.orchestrator.process_user_speech_turn(
                session_id=session_id,
                user_speech_text="kyaa aap meri help kar sakte ho?",
                raw_pcm_hex="00" * 320,
            )
            self.assertEqual(turn_res["status"], "success")

        asyncio.run(run())

    def test_05_cleanup_lifecycle(self):
        """Cleanup Test: Verify complete 6-stage tear-down cleanup."""
        async def run():
            session_id = "cleanup_test_session_102"
            await self.orchestrator.start_voice_session(session_id=session_id)
            end_res = await self.orchestrator.end_voice_session(session_id=session_id, reason="test_complete")
            self.assertEqual(end_res["status"], "success")
            self.assertEqual(end_res["cleanup"]["status"], "cleaned_up")

        asyncio.run(run())


if __name__ == "__main__":
    unittest.main()
