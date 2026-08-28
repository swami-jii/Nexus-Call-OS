from abc import ABC, abstractmethod
from typing import Any


class BaseProvider(ABC):
    """Abstract Base Provider for all Voice OS Integrations."""

    @abstractmethod
    def get_provider_name(self) -> str:
        """Return the unique name of the provider."""

    @abstractmethod
    async def health_check(self) -> dict[str, Any]:
        """Check connection health and validate API credentials."""


class TelephonyProviderInterface(BaseProvider):
    """Interface for PSTN & SIP Telephony Call Dispatch Providers."""

    @abstractmethod
    async def initiate_call(
        self,
        to_number: str,
        from_number: str,
        agent_id: str,
        webhook_url: str | None = None,
    ) -> dict[str, Any]:
        """Initiate an outbound phone call."""

    @abstractmethod
    async def terminate_call(self, call_sid: str) -> bool:
        """Hang up or terminate an active phone call."""

    @abstractmethod
    async def get_call_status(self, call_sid: str) -> dict[str, Any]:
        """Get the current call status (queued, ringing, in-progress, completed)."""


class TTSProviderInterface(BaseProvider):
    """Interface for Text-To-Speech (TTS) Voice Synthesis Providers."""

    @abstractmethod
    async def synthesize_speech(
        self, text: str, voice_id: str | None = None, language: str = "en-US"
    ) -> bytes:
        """Synthesize text into audio bytes (WAV/MP3/PCM)."""

    @abstractmethod
    async def list_available_voices(self) -> list[dict[str, Any]]:
        """List supported voice profiles."""


class STTProviderInterface(BaseProvider):
    """Interface for Speech-To-Text (STT) Audio Transcription Providers."""

    @abstractmethod
    async def transcribe_audio_chunk(
        self, audio_bytes: bytes, sample_rate: int = 16000, language: str = "en-US"
    ) -> dict[str, Any]:
        """Transcribe an incoming audio chunk into text with confidence score."""


class LLMProviderInterface(BaseProvider):
    """Interface for LLM Conversational Intelligence & Reasoning Providers."""

    @abstractmethod
    async def generate_response(
        self,
        system_prompt: str,
        user_input: str,
        conversation_history: list[dict[str, str]] | None = None,
    ) -> dict[str, Any]:
        """Generate conversational response text given prompt and history."""
