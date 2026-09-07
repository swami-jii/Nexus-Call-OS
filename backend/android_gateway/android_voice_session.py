"""
Android GSM Gateway Live Voice Conversation Session Module
Nexus Call OS v2.4 Enterprise

Manages real-time bidirectional AI voice conversation over cellular phone calls:
1. Generates authentic opening greeting speech on call answer.
2. Ingests 16kHz PCM audio stream from companion phone microphone with VAD.
3. Transcribes user speech using Deepgram / Whisper / STT providers.
4. Invokes DynamicLLMInvoker for conversational responses.
5. Synthesizes AI speech into 16kHz Linear PCM using ElevenLabs / OpenAI TTS / Cartesia.
6. Streams PCM chunks back to companion AudioTrack for live phone playback.
"""

import os
import math
import time
import struct
import base64
import logging
import asyncio
from typing import Dict, Any, List, Optional
import httpx

from backend.database.session import SessionLocal
from backend.models.models import Agent as AgentModel
from backend.routers.providers import resolve_provider_credential
from backend.routers.knowledge_base import DynamicLLMInvoker

logger = logging.getLogger("NexusAndroidVoiceSession")


def generate_synthetic_speech_tone_pcm(duration_sec: float = 1.2, freq_hz: float = 440.0, sample_rate: int = 16000) -> bytes:
    """Generates pleasant chime PCM tone as fallback if external TTS credentials are not yet configured."""
    num_samples = int(duration_sec * sample_rate)
    pcm_bytes = bytearray()
    for i in range(num_samples):
        t = i / sample_rate
        # Gentle dual-frequency harmonized chime with decaying envelope
        envelope = math.exp(-3.0 * t / duration_sec)
        sample_val = int(envelope * 12000.0 * (0.6 * math.sin(2.0 * math.pi * freq_hz * t) + 0.4 * math.sin(2.0 * math.pi * (freq_hz * 1.5) * t)))
        sample_val = max(-32768, min(32767, sample_val))
        pcm_bytes.extend(struct.pack("<h", sample_val))
    return bytes(pcm_bytes)


class AndroidVoiceSession:
    """Manages an active cellular voice call AI conversation turn pipeline."""

    def __init__(
        self,
        device_id: str,
        caller_number: str = "Unknown",
        agent_id: Optional[str] = None,
    ):
        self.device_id = device_id
        self.caller_number = caller_number
        self.agent_id = agent_id
        self.created_at = time.time()
        self.is_active = True

        # Resolved Agent Details
        self.agent_name = "Nexus AI Voice Assistant"
        self.agent_language = "hi-IN"
        self.agent_voice_id = "21m00Tcm4TlvDq8ikWAM"  # Default natural voice
        self.greeting_text = "नमस्ते! Nexus AI में आपका स्वागत है। मैं आपकी क्या सहायता कर सकता हूँ?"
        self.system_prompt = (
            "You are a professional, helpful, polite AI calling agent operating on Nexus Call OS. "
            "Keep your responses concise, conversational, and direct for phone conversations. "
            "Respond naturally in Hindi or English matching the user's language."
        )

        self.conversation_history: List[Dict[str, str]] = []
        self._load_agent_config()

        # Inbound Audio Accumulator & VAD
        self._audio_buffer = bytearray()
        self._speech_frames_count = 0
        self._silence_frames_count = 0
        self._is_user_speaking = False
        self._last_speech_time = time.time()
        self._is_processing_turn = False

    def _load_agent_config(self) -> None:
        try:
            with SessionLocal() as db:
                agent = None
                if self.agent_id:
                    agent = db.query(AgentModel).filter(AgentModel.id == self.agent_id).first()
                if not agent:
                    agent = db.query(AgentModel).filter(AgentModel.status == "active").first()

                if agent:
                    self.agent_name = agent.name or "Nexus AI Voice Assistant"
                    self.agent_language = agent.language or "hi-IN"
                    if agent.voice_id:
                        self.agent_voice_id = agent.voice_id
                    if agent.system_prompt:
                        self.system_prompt = agent.system_prompt

                    is_hindi = "hi" in self.agent_language.lower()
                    if is_hindi:
                        self.greeting_text = f"नमस्ते! मैं {self.agent_name} बोल रहा हूँ Nexus Call OS से। मैं आपकी क्या मदद कर सकता हूँ?"
                    else:
                        self.greeting_text = f"Hello! Thank you for calling. I am {self.agent_name} from Nexus Call OS. How may I help you today?"
        except Exception as e:
            logger.warning(f"Could not load agent config for voice session: {e}")

        self.conversation_history.append({"role": "assistant", "content": self.greeting_text})

    async def get_greeting_pcm(self) -> bytes:
        """Synthesizes and returns opening greeting 16kHz PCM audio."""
        logger.info(f"[VoiceSession] Synthesizing greeting: '{self.greeting_text}' for caller {self.caller_number}")
        pcm = await self.synthesize_speech_pcm(self.greeting_text)
        return pcm

    async def synthesize_speech_pcm(self, text: str) -> bytes:
        """Synthesizes text into 16kHz 16-bit mono Linear PCM bytes."""
        if not text or not text.strip():
            return b""

        clean_text = text.strip()
        voice_id = self.agent_voice_id.strip() if self.agent_voice_id else "21m00Tcm4TlvDq8ikWAM"

        try:
            with SessionLocal() as db:
                eleven_key = resolve_provider_credential(db, "", "", "elevenlabs")
                openai_key = resolve_provider_credential(db, "", "", "openai")

            # 1. Try ElevenLabs with native pcm_16000 output format
            if eleven_key and len(eleven_key) > 8:
                try:
                    has_devanagari = any("\u0900" <= char <= "\u097F" for char in clean_text)
                    model_id = "eleven_multilingual_v2" if has_devanagari or "hi" in self.agent_language.lower() else "eleven_turbo_v2_5"
                    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=pcm_16000&optimize_streaming_latency=4"

                    async with httpx.AsyncClient(timeout=12.0) as client:
                        resp = await client.post(
                            url,
                            headers={"xi-api-key": eleven_key, "Content-Type": "application/json"},
                            json={
                                "text": clean_text,
                                "model_id": model_id,
                                "voice_settings": {"stability": 0.5, "similarity_boost": 0.8, "use_speaker_boost": True},
                            },
                        )
                        if resp.status_code == 200 and len(resp.content) > 100:
                            logger.info(f"[TTS] ElevenLabs synthesized {len(resp.content)} bytes PCM audio.")
                            return resp.content
                        else:
                            logger.warning(f"[TTS] ElevenLabs returned {resp.status_code}: {resp.text}")
                except Exception as e:
                    logger.warning(f"[TTS] ElevenLabs synthesis error: {e}")

            # 2. Try OpenAI TTS (pcm output format)
            if openai_key and len(openai_key) > 8:
                try:
                    async with httpx.AsyncClient(timeout=12.0) as client:
                        resp = await client.post(
                            "https://api.openai.com/v1/audio/speech",
                            headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
                            json={
                                "model": "tts-1",
                                "input": clean_text,
                                "voice": "alloy",
                                "response_format": "pcm",
                            },
                        )
                        if resp.status_code == 200 and len(resp.content) > 100:
                            # OpenAI returns 24kHz PCM, downsample to 16kHz
                            raw_24k = resp.content
                            logger.info(f"[TTS] OpenAI synthesized {len(raw_24k)} bytes PCM audio.")
                            return self._resample_24k_to_16k_pcm(raw_24k)
                except Exception as e:
                    logger.warning(f"[TTS] OpenAI synthesis error: {e}")

        except Exception as e:
            logger.warning(f"[TTS] General synthesis error: {e}")

        # Fallback harmonic chime tone
        logger.info("[TTS] Generating synthetic speech prompt tone fallback.")
        return generate_synthetic_speech_tone_pcm(duration_sec=1.5, freq_hz=520.0)

    def _resample_24k_to_16k_pcm(self, pcm_24k: bytes) -> bytes:
        """Linear downsample from 24kHz 16-bit mono to 16kHz 16-bit mono."""
        if len(pcm_24k) < 4:
            return pcm_24k
        num_samples_in = len(pcm_24k) // 2
        samples_in = struct.unpack(f"<{num_samples_in}h", pcm_24k)
        ratio = 16000 / 24000
        num_samples_out = int(num_samples_in * ratio)
        samples_out = []
        for i in range(num_samples_out):
            src_idx = i / ratio
            idx0 = int(src_idx)
            idx1 = min(idx0 + 1, num_samples_in - 1)
            frac = src_idx - idx0
            val = int(samples_in[idx0] * (1.0 - frac) + samples_in[idx1] * frac)
            samples_out.append(max(-32768, min(32767, val)))
        return struct.pack(f"<{len(samples_out)}h", *samples_out)

    async def transcribe_pcm_audio(self, pcm_bytes: bytes) -> str:
        """Transcribe 16kHz 16-bit mono Linear PCM audio buffer."""
        if len(pcm_bytes) < 3200:  # Less than 100ms
            return ""

        try:
            with SessionLocal() as db:
                deepgram_key = resolve_provider_credential(db, "", "", "deepgram")
                openai_key = resolve_provider_credential(db, "", "", "openai")

            # 1. Try Deepgram STT
            if deepgram_key and len(deepgram_key) > 8:
                try:
                    lang = "hi" if "hi" in self.agent_language.lower() else "en"
                    url = f"https://api.deepgram.com/v1/listen?model=nova-2&language={lang}&smart_format=true&encoding=linear16&sample_rate=16000&channels=1"
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        resp = await client.post(
                            url,
                            headers={"Authorization": f"Token {deepgram_key}", "Content-Type": "audio/raw"},
                            content=pcm_bytes,
                        )
                        if resp.status_code == 200:
                            data = resp.json()
                            transcript = data.get("results", {}).get("channels", [{}])[0].get("alternatives", [{}])[0].get("transcript", "").strip()
                            if transcript:
                                logger.info(f"[STT] Deepgram transcribed: '{transcript}'")
                                return transcript
                except Exception as e:
                    logger.warning(f"[STT] Deepgram error: {e}")

            # 2. Try OpenAI Whisper API (wrap PCM in WAV header)
            if openai_key and len(openai_key) > 8:
                try:
                    wav_bytes = self._wrap_pcm_in_wav(pcm_bytes, sample_rate=16000)
                    async with httpx.AsyncClient(timeout=12.0) as client:
                        files = {"file": ("audio.wav", wav_bytes, "audio/wav")}
                        data = {"model": "whisper-1"}
                        if "hi" in self.agent_language.lower():
                            data["language"] = "hi"
                        resp = await client.post(
                            "https://api.openai.com/v1/audio/transcriptions",
                            headers={"Authorization": f"Bearer {openai_key}"},
                            files=files,
                            data=data,
                        )
                        if resp.status_code == 200:
                            transcript = resp.json().get("text", "").strip()
                            if transcript:
                                logger.info(f"[STT] Whisper transcribed: '{transcript}'")
                                return transcript
                except Exception as e:
                    logger.warning(f"[STT] Whisper error: {e}")

        except Exception as e:
            logger.warning(f"[STT] General transcription error: {e}")

        return ""

    def _wrap_pcm_in_wav(self, pcm_bytes: bytes, sample_rate: int = 16000) -> bytes:
        """Adds standard 44-byte RIFF/WAVE header to raw PCM."""
        num_channels = 1
        bits_per_sample = 16
        byte_rate = sample_rate * num_channels * (bits_per_sample // 8)
        block_align = num_channels * (bits_per_sample // 8)
        data_size = len(pcm_bytes)

        header = struct.pack(
            "<4sI4s4sIHHIIHH4sI",
            b"RIFF",
            36 + data_size,
            b"WAVE",
            b"fmt ",
            16,
            1,  # PCM format
            num_channels,
            sample_rate,
            byte_rate,
            block_align,
            bits_per_sample,
            b"data",
            data_size,
        )
        return header + pcm_bytes

    async def process_inbound_pcm_chunk(self, pcm_chunk: bytes) -> Optional[bytes]:
        """Ingests microphone audio chunk, runs VAD, and executes STT->LLM->TTS turn on speech completion."""
        if not self.is_active or self._is_processing_turn:
            return None

        # Calculate RMS energy of this PCM chunk
        num_samples = len(pcm_chunk) // 2
        if num_samples == 0:
            return None

        samples = struct.unpack(f"<{num_samples}h", pcm_chunk)
        sum_sq = sum(s * s for s in samples)
        rms = math.sqrt(sum_sq / num_samples)

        is_voice = rms > 600.0  # VAD energy threshold

        if is_voice:
            self._audio_buffer.extend(pcm_chunk)
            self._speech_frames_count += 1
            self._silence_frames_count = 0
            self._is_user_speaking = True
            self._last_speech_time = time.time()
        elif self._is_user_speaking:
            self._audio_buffer.extend(pcm_chunk)
            self._silence_frames_count += 1
            silence_duration = time.time() - self._last_speech_time

            # User finished speaking: > 800ms silence and at least 0.5s audio collected
            if silence_duration > 0.8 and len(self._audio_buffer) >= 16000:
                self._is_processing_turn = True
                audio_to_process = bytes(self._audio_buffer)
                self._audio_buffer.clear()
                self._is_user_speaking = False
                self._speech_frames_count = 0
                self._silence_frames_count = 0

                try:
                    logger.info(f"[VoiceSession] User speech turn completed ({len(audio_to_process)} bytes). Transcribing...")
                    transcript = await self.transcribe_pcm_audio(audio_to_process)
                    if transcript:
                        logger.info(f"[VoiceSession] User said: '{transcript}'. Generating AI response...")
                        self.conversation_history.append({"role": "user", "content": transcript})

                        # Invoke LLM
                        ai_reply_text = await self._generate_llm_response(transcript)
                        self.conversation_history.append({"role": "assistant", "content": ai_reply_text})
                        logger.info(f"[VoiceSession] AI Response: '{ai_reply_text}'. Synthesizing PCM audio...")

                        # Synthesize speech
                        pcm_response = await self.synthesize_speech_pcm(ai_reply_text)
                        return pcm_response
                except Exception as e:
                    logger.error(f"[VoiceSession] Turn processing error: {e}", exc_info=True)
                finally:
                    self._is_processing_turn = False

        return None

    async def _generate_llm_response(self, user_input: str) -> str:
        """Executes LLM call using centralized DynamicLLMInvoker."""
        try:
            with SessionLocal() as db:
                res = await DynamicLLMInvoker.call_conversation_llm_async(
                    db=db,
                    user_input=user_input,
                    conversation_history=self.conversation_history,
                    system_prompt=self.system_prompt,
                    preferred_language=self.agent_language,
                )
                if res and res.get("text"):
                    return res["text"].strip()
        except Exception as e:
            logger.warning(f"[VoiceSession] DynamicLLMInvoker error: {e}")

        # Fallback conversational response
        if "hi" in self.agent_language.lower():
            return "जी, मैं आपकी बात समझ गया। मैं आपकी इसमें पूरी सहायता कर सकता हूँ।"
        return "I understand your request. I am here to assist you with everything you need."


class AndroidVoiceSessionManager:
    """Manages active voice sessions for connected Android companion devices."""

    def __init__(self):
        self._sessions: Dict[str, AndroidVoiceSession] = {}

    async def start_session(self, device_id: str, caller_number: str = "Unknown", agent_id: Optional[str] = None) -> AndroidVoiceSession:
        session = AndroidVoiceSession(device_id=device_id, caller_number=caller_number, agent_id=agent_id)
        self._sessions[device_id] = session
        return session

    def get_session(self, device_id: str) -> Optional[AndroidVoiceSession]:
        return self._sessions.get(device_id)

    def end_session(self, device_id: str) -> None:
        session = self._sessions.pop(device_id, None)
        if session:
            session.is_active = False
            logger.info(f"[VoiceSessionManager] Ended voice session for device {device_id}")
