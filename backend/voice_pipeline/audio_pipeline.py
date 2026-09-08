import base64
import time

from backend.voice_pipeline.calling_optimizer import calling_optimizer
from backend.voice_pipeline.session_manager import CallSession, session_manager


class VoicePipelineEngine:
    """
    Production-ready Real-time Voice Pipeline Orchestrator.
    Flow: Twilio Stream -> Deepgram STT -> LLM -> ElevenLabs TTS -> Twilio Stream
    """

    def __init__(self, session: CallSession):
        self.session = session
        self.audio_buffer = bytearray()
        self.is_processing_llm = False

    async def handle_incoming_media(self, payload_base64: str) -> str | None:
        """
        Process incoming audio frame (mu-law 8kHz base64 from Twilio).
        Passes frame to STT engine and triggers LLM on turn completion.
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
                    print(f"[Engine] Interrupt: call={self.session.call_id}")

                self.session.set_speaking_status("user_speaking")
                self.session.add_transcript("user", transcript)

                # Process turn with LLM and TTS
                outbound_audio = await self.process_dialogue_turn(transcript)
                return outbound_audio

        return None

    async def process_dialogue_turn(self, user_transcript: str) -> str:
        """
        Send transcript to LLM, generate response, synthesize via TTS.
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

        # 1. LLM Generation
        llm_provider = provider_manager.get_llm_provider()
        system_prompt = (
            "You are a professional AI voice assistant operating on Create Call OS. "
            "Keep responses concise, conversational, and direct for voice phone calls.\n"
            + calling_optimizer.get_hindi_system_prompt_directive()
        )

        start_llm = time.time()
        llm_res = await llm_provider.generate_response(
            system_prompt=system_prompt,
            user_input=user_transcript,
            conversation_history=self.session.conversation_history[:-1],
        )
        llm_duration = round((time.time() - start_llm) * 1000, 2)
        self.session.latency_ms["llm_first_token"] = llm_duration

        raw_ai_text = llm_res.get("text", "I'm processing your request.").strip()
        ai_response_text = calling_optimizer.clean_text_for_calling(raw_ai_text)
        self.session.add_transcript("assistant", ai_response_text)

        # Update token metrics
        tokens = len(user_transcript.split()) + len(ai_response_text.split())
        cost = tokens * 0.00005
        self.session.update_metrics(tokens=tokens, cost=cost)

        # Check for interrupt before TTS
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

        # Encode audio payload to base64 mu-law for Twilio WebSocket transmission
        outbound_base64 = base64.b64encode(audio_bytes).decode("utf-8")
        return outbound_base64


def create_pipeline(call_id: str) -> VoicePipelineEngine:
    session = session_manager.get_session(call_id)
    if not session:
        session = session_manager.create_session(call_id=call_id)
    return VoicePipelineEngine(session)
