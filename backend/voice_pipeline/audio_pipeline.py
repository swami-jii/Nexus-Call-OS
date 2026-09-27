import base64
import time
from typing import Optional

from backend.conversation_engine.engine_brain import ConversationEngine
from backend.integrations.manager import provider_manager
from backend.voice_pipeline.calling_optimizer import calling_optimizer
from backend.voice_pipeline.session_manager import CallSession, session_manager


class VoicePipelineEngine:
    """
    Production-ready Real-time Voice Pipeline Orchestrator.
    Flow: Twilio / SIP / GSM Stream -> STT -> ConversationEngine Core Brain -> TTS -> Audio Stream
    """

    def __init__(self, session: CallSession):
        self.session = session
        self.audio_buffer = bytearray()
        self.is_processing_llm = False
        self.conv_engine = ConversationEngine(
            session_id=session.call_id,
            agent_id=getattr(session, "agent_id", "default_agent"),
            agent_name="Nikita",
        )

    async def handle_incoming_media(self, payload_base64: str) -> Optional[str]:
        """
        Process incoming audio frame (mu-law 8kHz base64 from telephony carrier).
        Passes frame to STT engine and triggers ConversationEngine on turn completion.
        """
        try:
            pcm_chunk = base64.b64decode(payload_base64)
            self.audio_buffer.extend(pcm_chunk)
        except Exception as e:
            print(f"[VoicePipelineEngine] Audio decode error: {e}")
            return None

        # Process STT when buffer reaches audio chunk threshold (~0.5 sec)
        if len(self.audio_buffer) >= 4000 and not self.is_processing_llm:
            stt_provider = provider_manager.get_stt_provider()
            chunk = bytes(self.audio_buffer)
            self.audio_buffer.clear()

            start_stt = time.time()
            stt_res = await stt_provider.transcribe_audio_chunk(chunk)
            stt_duration = round((time.time() - start_stt) * 1000, 2)
            self.session.latency_ms["stt_latency"] = stt_duration

            transcript = stt_res.get("transcript", "").strip()
            if transcript:
                # User interrupt detection: If AI was speaking, halt AI speech
                if self.session.speaker_status == "ai_speaking":
                    self.session.is_interrupted = True
                    self.session.set_speaking_status("interrupted")
                    self.conv_engine._on_bargein()
                    print(f"[Engine] Interrupt: call={self.session.call_id}")

                self.session.set_speaking_status("user_speaking")
                self.session.add_transcript("user", transcript)

                # Process turn with Conversation Engine and TTS
                outbound_audio = await self.process_dialogue_turn(transcript)
                return outbound_audio

        return None

    async def process_dialogue_turn(self, user_transcript: str) -> str:
        """
        Send transcript to ConversationEngine, evaluate policy/emotion, and synthesize via TTS.
        """
        if (
            not self.session.transcript
            or self.session.transcript[-1]["speaker"] != "user"
        ):
            self.session.add_transcript("user", user_transcript)

        self.is_processing_llm = True
        self.session.set_speaking_status("ai_speaking")
        self.session.is_interrupted = False

        start_total = time.time()

        # 1. Process Turn via ConversationEngine Core Brain
        turn_result = self.conv_engine.process_text(user_transcript)
        ai_response_text = turn_result.get("ai_response", "I understand. How may I help?").strip()
        humanized_ssml = turn_result.get("humanized_ssml", ai_response_text)

        self.session.add_transcript("assistant", ai_response_text)

        # Update token and latency metrics
        tokens = len(user_transcript.split()) + len(ai_response_text.split())
        cost = tokens * 0.00005
        self.session.update_metrics(tokens=tokens, cost=cost)
        self.session.latency_ms["llm_first_token"] = turn_result.get("latency_ms", 10.0)

        # Check for user interrupt before TTS
        if self.session.is_interrupted:
            self.is_processing_llm = False
            self.session.set_speaking_status("idle")
            return ""

        # 2. TTS Audio Synthesis
        tts_provider = provider_manager.get_tts_provider()
        start_tts = time.time()
        audio_bytes = await tts_provider.synthesize_speech(ai_response_text)
        tts_duration = round((time.time() - start_tts) * 1000, 2)
        self.session.latency_ms["tts_latency"] = tts_duration

        total_duration = round((time.time() - start_total) * 1000, 2)
        self.session.latency_ms["total_pipeline"] = total_duration

        self.is_processing_llm = False
        self.session.set_speaking_status("idle")

        # Encode audio payload to base64 mu-law for telephony carrier transmission
        outbound_base64 = base64.b64encode(audio_bytes).decode("utf-8")
        return outbound_base64


def create_pipeline(call_id: str) -> VoicePipelineEngine:
    session = session_manager.get_session(call_id)
    if not session:
        session = session_manager.create_session(call_id=call_id)
    return VoicePipelineEngine(session)
